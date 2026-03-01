package worker

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
)

// JobRequest holds the information needed to process a single ingestion job.
type JobRequest struct {
	JobID     bson.ObjectID
	EpisodeID bson.ObjectID
	SourceURL string
	Source    string // "youtube" | "upload"
}

// jobQueue is a buffered channel that holds pending job requests.
// Buffered at 100 so that HTTP handlers never block when enqueuing.
var jobQueue = make(chan JobRequest, 100)

// Start launches a single sequential worker goroutine that reads jobs from jobQueue.
// The goroutine stops when ctx is cancelled (i.e., on server shutdown).
// Call this from main() before serving requests.
func Start(ctx context.Context, database *mongo.Database, hlsRoot string) {
	go func() {
		for {
			select {
			case job := <-jobQueue:
				processJob(ctx, database, hlsRoot, job)
			case <-ctx.Done():
				log.Println("worker: context cancelled, stopping")
				return
			}
		}
	}()
	log.Printf("worker: started (hlsRoot=%s)", hlsRoot)
}

// Enqueue adds a JobRequest to the processing queue. This is non-blocking because
// jobQueue is buffered. Call this from the episode CREATE handler after inserting
// the Job document into MongoDB.
func Enqueue(req JobRequest) {
	jobQueue <- req
}

// ResumeJobs queries MongoDB for pending jobs from previous server runs and re-enqueues them.
// Call this from main() after Start() to handle restarts with unfinished jobs.
func ResumeJobs(ctx context.Context, database *mongo.Database) {
	cursor, err := database.Collection(db.CollJobs).Find(ctx, bson.D{
		{Key: "status", Value: bson.D{{Key: "$in", Value: bson.A{
			models.JobStatusPending,
			models.JobStatusDownloading,
			models.JobStatusTranscoding,
		}}}},
	})
	if err != nil {
		log.Printf("worker: ResumeJobs query failed: %v", err)
		return
	}
	defer cursor.Close(ctx)

	var jobs []models.Job
	if err := cursor.All(ctx, &jobs); err != nil {
		log.Printf("worker: ResumeJobs decode failed: %v", err)
		return
	}

	if len(jobs) == 0 {
		return
	}

	log.Printf("worker: resuming %d pending/in-progress jobs", len(jobs))
	for _, j := range jobs {
		// Reset to pending so the worker starts from the beginning
		updateJobStatus(ctx, database, j.ID, models.JobStatusPending, "")
		Enqueue(JobRequest{
			JobID:     j.ID,
			EpisodeID: j.EpisodeID,
			SourceURL: j.SourceURL,
			Source:    j.Source,
		})
	}
}

// processJob runs the full ingestion pipeline for a single job:
// download via yt-dlp → transcode to HLS via FFmpeg → update episode status.
// This function runs synchronously inside the single worker goroutine.
func processJob(ctx context.Context, database *mongo.Database, hlsRoot string, req JobRequest) {
	log.Printf("worker: starting job %s (episode %s, source=%s)", req.JobID.Hex(), req.EpisodeID.Hex(), req.Source)

	outputPath := filepath.Join(hlsRoot, req.EpisodeID.Hex(), "source.mp4")

	if req.Source != "upload" {
		// Step 1: mark as downloading
		now := time.Now()
		updateJobStatusWithTime(ctx, database, req.JobID, models.JobStatusDownloading, "", &now, nil)

		// Step 2: download via yt-dlp
		if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
			log.Printf("worker: mkdir failed for job %s: %v", req.JobID.Hex(), err)
			updateJobStatus(ctx, database, req.JobID, models.JobStatusFailed, "failed to create output directory: "+err.Error())
			return
		}

		ytCmd := exec.CommandContext(ctx, "yt-dlp",
			"--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
			"--merge-output-format", "mp4",
			"--sleep-requests", "5",
			"--no-playlist",
			"-o", outputPath,
			req.SourceURL,
		)
		var ytStderr bytes.Buffer
		ytCmd.Stderr = &ytStderr
		if err := ytCmd.Run(); err != nil {
			errMsg := "yt-dlp failed: " + err.Error()
			if ytStderr.Len() > 0 {
				errMsg += " | stderr: " + ytStderr.String()
			}
			log.Printf("worker: yt-dlp error for job %s: %v", req.JobID.Hex(), errMsg)
			updateJobStatus(ctx, database, req.JobID, models.JobStatusFailed, errMsg)
			return
		}
		log.Printf("worker: download complete for job %s", req.JobID.Hex())
	}

	// Step 3: mark as transcoding (upload jobs skip Steps 1-2 — source.mp4 already on disk)
	updateJobStatus(ctx, database, req.JobID, models.JobStatusTranscoding, "")

	// Step 4: transcode to multi-rendition HLS via FFmpeg
	outDir := filepath.Join(hlsRoot, req.EpisodeID.Hex())
	// Create per-rendition subdirectories (FFmpeg requires them to pre-exist for %v path)
	for _, sub := range []string{"0", "1", "2"} {
		if err := os.MkdirAll(filepath.Join(outDir, sub), 0755); err != nil {
			errMsg := "failed to create rendition directory: " + err.Error()
			updateJobStatus(ctx, database, req.JobID, models.JobStatusFailed, errMsg)
			return
		}
	}

	if err := transcodeHLS(ctx, outputPath, outDir); err != nil {
		errMsg := "ffmpeg failed: " + err.Error()
		log.Printf("worker: ffmpeg error for job %s: %v", req.JobID.Hex(), errMsg)
		updateJobStatus(ctx, database, req.JobID, models.JobStatusFailed, errMsg)
		return
	}
	log.Printf("worker: transcode complete for job %s", req.JobID.Hex())

	// Step 5: mark job as ready
	completedAt := time.Now()
	updateJobStatusWithTime(ctx, database, req.JobID, models.JobStatusReady, "", nil, &completedAt)

	// Step 6: update episode status to "ready"
	_, err := database.Collection(db.CollEpisodes).UpdateOne(ctx,
		bson.D{{Key: "_id", Value: req.EpisodeID}},
		bson.D{{Key: "$set", Value: bson.D{
			{Key: "status", Value: "ready"},
			{Key: "updated_at", Value: time.Now()},
		}}},
	)
	if err != nil {
		log.Printf("worker: failed to update episode status for job %s: %v", req.JobID.Hex(), err)
	}

	// Step 7: clean up source file to save disk space
	if err := os.Remove(outputPath); err != nil {
		log.Printf("worker: failed to remove source file %s: %v", outputPath, err)
	}

	log.Printf("worker: job %s complete", req.JobID.Hex())
}

// transcodeHLS runs FFmpeg to produce three HLS renditions (720p, 480p, 360p)
// with a master.m3u8 playlist written to outDir.
// Keyframes are forced every 6 seconds using -force_key_frames to be fps-agnostic.
func transcodeHLS(ctx context.Context, inputPath, outDir string) error {
	args := []string{
		"-i", inputPath,
		// Split input video into 3 scaled renditions
		"-filter_complex",
		"[0:v]split=3[v1][v2][v3];" +
			"[v1]scale=w=1280:h=720[v1out];" +
			"[v2]scale=w=854:h=480[v2out];" +
			"[v3]scale=w=640:h=360[v3out]",
		// 720p video stream
		"-map", "[v1out]", "-c:v:0", "libx264",
		"-b:v:0", "2800k", "-maxrate:v:0", "2996k", "-bufsize:v:0", "4200k",
		// 480p video stream
		"-map", "[v2out]", "-c:v:1", "libx264",
		"-b:v:1", "1400k", "-maxrate:v:1", "1498k", "-bufsize:v:1", "2100k",
		// 360p video stream
		"-map", "[v3out]", "-c:v:2", "libx264",
		"-b:v:2", "800k", "-maxrate:v:2", "856k", "-bufsize:v:2", "1200k",
		// Audio streams (one per rendition)
		"-map", "a:0", "-c:a:0", "aac", "-b:a:0", "192k", "-ac", "2",
		"-map", "a:0", "-c:a:1", "aac", "-b:a:1", "128k", "-ac", "2",
		"-map", "a:0", "-c:a:2", "aac", "-b:a:2", "96k", "-ac", "2",
		// Keyframe alignment: force keyframe every 6s regardless of source fps
		"-force_key_frames", "expr:gte(t,n_forced*6)",
		"-sc_threshold", "0",
		// HLS output settings
		"-f", "hls",
		"-hls_time", "6",
		"-hls_playlist_type", "vod",
		"-hls_flags", "independent_segments",
		"-hls_segment_type", "mpegts",
		"-hls_segment_filename", filepath.Join(outDir, "%v", "seg%03d.ts"),
		"-master_pl_name", "master.m3u8",
		"-var_stream_map", "v:0,a:0 v:1,a:1 v:2,a:2",
		filepath.Join(outDir, "%v", "playlist.m3u8"),
	}

	var stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if stderr.Len() > 0 {
			return fmt.Errorf("%w | stderr: %s", err, stderr.String())
		}
		return err
	}
	return nil
}

// updateJobStatus is a convenience wrapper that updates job status and updated_at.
func updateJobStatus(ctx context.Context, database *mongo.Database, jobID bson.ObjectID, status models.JobStatus, errMsg string) {
	updateJobStatusWithTime(ctx, database, jobID, status, errMsg, nil, nil)
}

// updateJobStatusWithTime updates a job's status fields in MongoDB.
// Pass non-nil startedAt on the first status transition (downloading).
// Pass non-nil completedAt on terminal states (ready, failed).
func updateJobStatusWithTime(ctx context.Context, database *mongo.Database, jobID bson.ObjectID, status models.JobStatus, errMsg string, startedAt *time.Time, completedAt *time.Time) {
	fields := bson.D{
		{Key: "status", Value: status},
		{Key: "error", Value: errMsg},
		{Key: "updated_at", Value: time.Now()},
	}
	if startedAt != nil {
		fields = append(fields, bson.E{Key: "started_at", Value: startedAt})
	}
	if completedAt != nil {
		fields = append(fields, bson.E{Key: "completed_at", Value: completedAt})
	}

	_, err := database.Collection(db.CollJobs).UpdateOne(ctx,
		bson.D{{Key: "_id", Value: jobID}},
		bson.D{{Key: "$set", Value: fields}},
	)
	if err != nil {
		log.Printf("worker: failed to update job %s status to %s: %v", jobID.Hex(), status, err)
	}
}
