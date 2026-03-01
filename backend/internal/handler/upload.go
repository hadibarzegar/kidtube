package handler

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"github.com/hadi/kidtube/internal/worker"
)

const (
	maxUploadSize  = 2 * 1024 * 1024 * 1024 // 2 GiB
	maxFieldSize   = 4096                    // 4 KiB for text fields
	maxTitleSize   = 512
	maxChannelSize = 256
)

// UploadEpisode returns an http.HandlerFunc that accepts a multipart/form-data
// POST request containing a video file (field name "file") and episode metadata.
// The file is streamed directly to {hlsRoot}/{episodeID}/source.mp4 without
// buffering in memory.
//
// Form fields:
//   - channel_id  (required) — hex ObjectID of the parent channel
//   - title       (required) — episode title
//   - description (optional)
//   - order       (optional, integer)
//   - subtitle_url (optional)
//   - file        (required) — the video file part
//
// Returns 202 Accepted with the created Episode JSON on success.
func UploadEpisode(database *mongo.Database, hlsRoot string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Cap total request body at 2 GiB to prevent resource exhaustion.
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

		// Pre-allocate episodeID so we know the output directory before streaming.
		episodeID := bson.NewObjectID()
		outDir := filepath.Join(hlsRoot, episodeID.Hex())

		if err := os.MkdirAll(outDir, 0755); err != nil {
			log.Printf("upload: mkdir failed for episode %s: %v", episodeID.Hex(), err)
			writeJSONError(w, http.StatusInternalServerError, "failed to create output directory")
			return
		}

		// Use streaming multipart reader — NOT ParseMultipartForm which buffers to disk/mem.
		mr, err := r.MultipartReader()
		if err != nil {
			os.RemoveAll(outDir) //nolint:errcheck
			writeJSONError(w, http.StatusBadRequest, "expected multipart/form-data request")
			return
		}

		// Collect text fields and stream the file part.
		var (
			channelID   string
			title       string
			description string
			order       int
			subtitleURL string
			fileWritten bool
		)

		for {
			part, err := mr.NextPart()
			if err == io.EOF {
				break
			}
			if err != nil {
				os.RemoveAll(outDir) //nolint:errcheck
				if strings.Contains(err.Error(), "too large") {
					writeJSONError(w, http.StatusRequestEntityTooLarge, "request body too large (max 2 GB)")
					return
				}
				writeJSONError(w, http.StatusInternalServerError, "error reading multipart data")
				return
			}

			fieldName := part.FormName()
			switch fieldName {
			case "channel_id":
				data, err := io.ReadAll(io.LimitReader(part, maxChannelSize))
				if err != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					writeJSONError(w, http.StatusBadRequest, "failed to read channel_id")
					return
				}
				channelID = strings.TrimSpace(string(data))

			case "title":
				data, err := io.ReadAll(io.LimitReader(part, maxTitleSize))
				if err != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					writeJSONError(w, http.StatusBadRequest, "failed to read title")
					return
				}
				title = strings.TrimSpace(string(data))

			case "description":
				data, err := io.ReadAll(io.LimitReader(part, maxFieldSize))
				if err != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					writeJSONError(w, http.StatusBadRequest, "failed to read description")
					return
				}
				description = strings.TrimSpace(string(data))

			case "order":
				data, err := io.ReadAll(io.LimitReader(part, 32))
				if err != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					writeJSONError(w, http.StatusBadRequest, "failed to read order")
					return
				}
				if v, err := strconv.Atoi(strings.TrimSpace(string(data))); err == nil {
					order = v
				}

			case "subtitle_url":
				data, err := io.ReadAll(io.LimitReader(part, maxFieldSize))
				if err != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					writeJSONError(w, http.StatusBadRequest, "failed to read subtitle_url")
					return
				}
				subtitleURL = strings.TrimSpace(string(data))

			case "file":
				destPath := filepath.Join(outDir, "source.mp4")
				dst, err := os.Create(destPath)
				if err != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					writeJSONError(w, http.StatusInternalServerError, "failed to create output file")
					return
				}

				_, copyErr := io.Copy(dst, part)
				closeErr := dst.Close() // Close explicitly — detect write errors before responding.

				if copyErr != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					if strings.Contains(copyErr.Error(), "too large") || strings.Contains(copyErr.Error(), "request body too large") {
						writeJSONError(w, http.StatusRequestEntityTooLarge, "file too large (max 2 GB)")
						return
					}
					log.Printf("upload: io.Copy failed for episode %s: %v", episodeID.Hex(), copyErr)
					writeJSONError(w, http.StatusInternalServerError, "failed to write file")
					return
				}
				if closeErr != nil {
					os.RemoveAll(outDir) //nolint:errcheck
					log.Printf("upload: file close failed for episode %s: %v", episodeID.Hex(), closeErr)
					writeJSONError(w, http.StatusInternalServerError, "failed to flush file to disk")
					return
				}
				fileWritten = true
			}
		}

		// Validate required fields.
		if !fileWritten {
			os.RemoveAll(outDir) //nolint:errcheck
			writeJSONError(w, http.StatusBadRequest, "missing required field: file")
			return
		}
		if channelID == "" {
			os.RemoveAll(outDir) //nolint:errcheck
			writeJSONError(w, http.StatusBadRequest, "missing required field: channel_id")
			return
		}
		if title == "" {
			os.RemoveAll(outDir) //nolint:errcheck
			writeJSONError(w, http.StatusBadRequest, "missing required field: title")
			return
		}

		channelObjID, err := bson.ObjectIDFromHex(channelID)
		if err != nil {
			os.RemoveAll(outDir) //nolint:errcheck
			writeJSONError(w, http.StatusBadRequest, "invalid channel_id")
			return
		}

		now := time.Now().UTC()

		// Insert Episode document.
		episode := models.Episode{
			ID:          episodeID,
			ChannelID:   channelObjID,
			Title:       title,
			Description: description,
			Order:       order,
			SubtitleURL: subtitleURL,
			Status:      "pending",
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if _, err := database.Collection(db.CollEpisodes).InsertOne(ctx, episode); err != nil {
			os.RemoveAll(outDir) //nolint:errcheck
			log.Printf("upload: failed to insert episode %s: %v", episodeID.Hex(), err)
			writeJSONError(w, http.StatusInternalServerError, "failed to create episode")
			return
		}

		// Insert Job document with source="upload".
		job := models.Job{
			EpisodeID: episodeID,
			SourceURL: "",
			Source:    "upload",
			Status:    models.JobStatusPending,
			CreatedAt: now,
			UpdatedAt: now,
		}
		res, err := database.Collection(db.CollJobs).InsertOne(ctx, job)
		if err != nil {
			// Episode inserted but job failed — log and return error; episode will be orphaned
			// in pending state (admin can delete and retry). Do NOT remove outDir — file is good.
			log.Printf("upload: failed to insert job for episode %s: %v", episodeID.Hex(), err)
			writeJSONError(w, http.StatusInternalServerError, "failed to create transcoding job")
			return
		}
		job.ID = res.InsertedID.(bson.ObjectID)

		// Enqueue the job for transcoding — worker will skip yt-dlp since source="upload".
		worker.Enqueue(worker.JobRequest{
			JobID:     job.ID,
			EpisodeID: episodeID,
			Source:    "upload",
		})

		log.Printf("upload: episode %s created and queued for transcoding (job %s)", episodeID.Hex(), job.ID.Hex())

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(episode) //nolint:errcheck
	}
}

// writeJSONError writes a JSON error response with the given status code and message.
func writeJSONError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message}) //nolint:errcheck
}
