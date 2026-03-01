# Phase 6: Fix Ingestion Pipeline Wiring - Research

**Researched:** 2026-03-01
**Domain:** Go backend — handler-to-worker wiring, integration defect repair
**Confidence:** HIGH

## Summary

Phase 6 is a surgical bug fix, not a feature build. The v1.0 audit identified two missing `worker.Enqueue` call sites in the Go admin-api backend. The video ingestion pipeline infrastructure (worker goroutine, yt-dlp download, FFmpeg HLS transcode, nginx serving) is already fully implemented and correct — it just never receives jobs because the handlers that create and reset jobs never enqueue them into the buffered channel.

The fix requires exactly two code changes, each a handful of lines in Go. `CreateEpisode` in `backend/internal/handler/episode.go` inserts a Job document but never calls `worker.Enqueue`, so the worker goroutine runs but starves. `RetryJob` in `backend/internal/handler/job.go` resets a failed job to pending in MongoDB but never calls `worker.Enqueue`, so the job stays phantom-pending forever. Both fixes follow the exact pattern already established by `UploadEpisode` in `backend/internal/handler/upload.go`, which correctly calls `worker.Enqueue` after inserting its job.

Beyond the Go fixes, the phase includes a full end-to-end validation pass: submitting a YouTube URL through the admin UI, watching the job progress through downloading → transcoding → ready, and confirming Video.js plays the resulting HLS stream. This validation closes all six partially-satisfied requirements (VIDE-01, VIDE-02, VIDE-03, VIDE-05, VIDE-06, PLAY-01).

**Primary recommendation:** Two targeted Go edits + one end-to-end smoke test. No new packages, no structural changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIDE-01 | Admin can paste a YouTube URL and trigger async download + HLS transcode | Fix: `CreateEpisode` must call `worker.Enqueue` after Job insert |
| VIDE-02 | System downloads video via yt-dlp with rate-limiting protection (sequential queue, sleep intervals) | Already implemented in `worker.processJob`; never called because Enqueue missing |
| VIDE-03 | FFmpeg transcodes to multi-rendition HLS (360p, 480p, 720p) with keyframe-aligned segments and master playlist | Already implemented in `worker.transcodeHLS`; never called because Enqueue missing |
| VIDE-05 | Failed jobs show error details and can be retried | Fix: `RetryJob` must call `worker.Enqueue` after status reset |
| VIDE-06 | HLS segments are written to a Docker volume served by nginx | Volume mounts, nginx alias, and HLS_ROOT are correct; blocked only by missing Enqueue |
| PLAY-01 | Video player plays HLS streams with adaptive bitrate switching | Video.js is correctly wired; blocked only by HLS files never being generated |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go standard library | go1.23 | No new imports needed | All worker/handler integration uses existing packages |
| `github.com/hadi/kidtube/internal/worker` | local | `worker.Enqueue(worker.JobRequest{...})` is the fix | Already imported by `upload.go`; the pattern to follow |
| `go.mongodb.org/mongo-driver/v2/bson` | v2 | ObjectID extraction after Job insert | Already imported in episode.go and job.go |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yt-dlp | latest (pip) | YouTube video download | Already installed in admin-api Docker image via `pip3 install yt-dlp` |
| FFmpeg | system (apk) | HLS transcoding | Already installed via `apk add ffmpeg` in admin-api Dockerfile |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct channel send via `worker.Enqueue` | Separate goroutine or message queue | No benefit — buffered channel (cap 100) is already non-blocking; adding complexity would be wrong |

**Installation:** No new packages required.

## Architecture Patterns

### Existing Project Structure (relevant to this phase)

```
backend/
├── cmd/admin-api/main.go              # Worker started here; handlers wired here
├── internal/
│   ├── handler/
│   │   ├── episode.go                 # CreateEpisode — MISSING worker.Enqueue (fix here)
│   │   ├── job.go                     # RetryJob — MISSING worker.Enqueue (fix here)
│   │   └── upload.go                  # UploadEpisode — CORRECT worker.Enqueue (use as template)
│   └── worker/
│       └── processor.go               # Enqueue(), Start(), ResumeJobs() — correct, no changes needed
```

### Pattern 1: Handler-to-Worker Wiring (the fix pattern)

**What:** After inserting a Job document into MongoDB, call `worker.Enqueue` with the job's ID, episode ID, source URL, and source type. The channel is buffered (cap 100) so the call never blocks HTTP handlers.

**When to use:** Every code path that creates or re-activates a Job document.

**The established pattern (from `upload.go` — already correct):**
```go
// Source: backend/internal/handler/upload.go lines 239-243
worker.Enqueue(worker.JobRequest{
    JobID:     job.ID,
    EpisodeID: episodeID,
    Source:    "upload",
})
```

**Fix for `CreateEpisode` (episode.go):**

The job insert currently captures no ID:
```go
_, err := database.Collection(db.CollJobs).InsertOne(ctx, job)
```

This needs to capture the inserted ID and then enqueue. Current code (lines 149-156 in episode.go):
```go
_, err := database.Collection(db.CollJobs).InsertOne(ctx, job)
if err != nil {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(map[string]string{"error": "failed to create job"})
    return
}
statusCode = http.StatusAccepted
```

After fix — capture `res`, extract `job.ID`, set `Source`, then enqueue:
```go
res, err := database.Collection(db.CollJobs).InsertOne(ctx, job)
if err != nil {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(map[string]string{"error": "failed to create job"})
    return
}
job.ID = res.InsertedID.(bson.ObjectID)
worker.Enqueue(worker.JobRequest{
    JobID:     job.ID,
    EpisodeID: episode.ID,
    SourceURL: req.SourceURL,
    Source:    "youtube",
})
statusCode = http.StatusAccepted
```

**Fix for `RetryJob` (job.go):**

After the MongoDB `UpdateOne` and before building the response:
```go
worker.Enqueue(worker.JobRequest{
    JobID:     job.ID,
    EpisodeID: job.EpisodeID,
    SourceURL: job.SourceURL,
    Source:    job.Source,
})
```

### Pattern 2: Import Addition

`episode.go` currently has no import for the `worker` package. The fix requires adding it.

Current imports in `episode.go`:
```go
import (
    "encoding/json"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/hadi/kidtube/internal/db"
    "github.com/hadi/kidtube/internal/models"
    "go.mongodb.org/mongo-driver/v2/bson"
    "go.mongodb.org/mongo-driver/v2/mongo"
)
```

Must add `"github.com/hadi/kidtube/internal/worker"`.

`job.go` also does not import worker. Must add the same import.

### Pattern 3: The `Source` Field on Job

The `models.Job` struct has a `Source string` field ("youtube" | "upload") added in Phase 5. The `CreateEpisode` handler currently does not set this field when creating a YouTube-source job (the field is left as the zero value ""). The audit's fix suggestion omits `Source: "youtube"` but the worker uses `Source` to decide whether to skip the yt-dlp download step:

```go
// worker/processor.go line 104
if req.Source != "upload" {
    // Step 1: mark as downloading
    // Step 2: download via yt-dlp
    ...
}
```

With `Source` unset (empty string), the condition `req.Source != "upload"` is `true`, so yt-dlp WILL run — the fix still works. However, for correctness and consistency with the `Source` field semantics, set `Source: "youtube"` explicitly. The Job document in MongoDB should also have `source: "youtube"` set — update the job struct literal in `CreateEpisode` to include `Source: "youtube"`.

### Anti-Patterns to Avoid

- **Defer enqueue to goroutine:** Do not wrap `worker.Enqueue` in a separate goroutine. The channel is already buffered — the call is non-blocking by design.
- **Call enqueue before DB insert:** Enqueue must happen after the Job document exists in MongoDB. The worker updates job status in MongoDB by job ID — if the document doesn't exist yet, those updates will silently fail.
- **Forget to capture InsertedID:** The current `CreateEpisode` discards the `InsertOne` result with `_`. This must change to capture `res` so `job.ID` can be extracted and passed to `worker.Enqueue`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queuing | Custom in-memory queue or goroutine pool | `worker.Enqueue` (buffered channel already exists) | Already implemented with correct capacity and sequential guarantee |
| YouTube download | Custom HTTP download | yt-dlp (already in Docker image) | Handles YouTube auth, format selection, rate limiting |
| HLS transcoding | Custom segmenter | FFmpeg (already in Docker image) | Multi-rendition, keyframe alignment, master playlist all implemented |

**Key insight:** Every hard problem in this phase is already solved. The only work is connecting two already-correct pieces with two function calls.

## Common Pitfalls

### Pitfall 1: Missing InsertedID Capture in CreateEpisode

**What goes wrong:** `CreateEpisode` currently discards the `InsertOne` result (`_, err := ...`). If you add `worker.Enqueue` without first capturing the inserted job ID, you cannot pass a valid `JobID` — the zero-value ObjectID is useless and the worker will fail to find the job in MongoDB.

**Why it happens:** The original implementation never needed the ID because it never called Enqueue.

**How to avoid:** Change `_, err :=` to `res, err :=` and extract `job.ID = res.InsertedID.(bson.ObjectID)` before calling Enqueue.

**Warning signs:** Compiling with `job.ID` being the zero ObjectID; worker logs showing job not found.

### Pitfall 2: Missing worker Import

**What goes wrong:** Go will refuse to compile if `worker.Enqueue` is called without importing `github.com/hadi/kidtube/internal/worker`.

**Why it happens:** Neither `episode.go` nor `job.go` currently imports the worker package.

**How to avoid:** Add the import to both files. `goimports` will catch this automatically.

**Warning signs:** Compilation error `undefined: worker`.

### Pitfall 3: Source Field Left Empty on YouTube Jobs

**What goes wrong:** Job documents created by `CreateEpisode` will have `source: ""` in MongoDB (empty string, not "youtube"). This doesn't break the pipeline (worker defaults to non-upload behavior), but it creates data inconsistency: the admin UI's Source badge logic defaults empty source to "YouTube" badge, which happens to be correct but is coincidental.

**Why it happens:** The `Source` field was added to `models.Job` in Phase 5 for the upload path; the YouTube path was never updated.

**How to avoid:** Set `Source: "youtube"` explicitly in the job struct literal inside `CreateEpisode`.

**Warning signs:** Jobs page shows correct "YouTube" badge (due to fallback default), but job documents in MongoDB have `source: ""` rather than `"youtube"`.

### Pitfall 4: End-to-End Test Requires Real yt-dlp and FFmpeg

**What goes wrong:** Validation must happen inside the running Docker Compose stack. Running Go unit tests or `go run` locally will not have yt-dlp or FFmpeg available (unless manually installed). The integration can only be verified by starting Docker Compose and exercising the full flow.

**Why it happens:** yt-dlp and FFmpeg are installed in the admin-api Docker image, not on the host.

**How to avoid:** Use `docker compose up` and exercise the flow through the admin UI or with `curl` against the admin-api port. Check logs with `docker compose logs admin-api -f`.

**Warning signs:** Local `go test` passes but the pipeline doesn't run in Docker.

### Pitfall 5: RetryJob Must Preserve Source Field

**What goes wrong:** `RetryJob` fetches the job from MongoDB before resetting status. The `job.Source` field will be populated from the fetched document. When passing it to `worker.Enqueue`, use `job.Source` (from the document) not a hardcoded string, because retry must work for both YouTube jobs and upload jobs.

**Why it happens:** Upload path was added in Phase 5 — retry must now handle both source types.

**How to avoid:** Pass `Source: job.Source` (not `Source: "youtube"`) to `worker.Enqueue` in `RetryJob`.

**Warning signs:** Upload jobs that fail and are retried get downloaded through yt-dlp (which would fail since `SourceURL` is empty for upload jobs).

## Code Examples

### Complete Fix for CreateEpisode (episode.go, lines ~141-162)

```go
// Source: backend/internal/handler/episode.go — current broken code + fix
if req.SourceURL != "" {
    job := models.Job{
        EpisodeID: episode.ID,
        SourceURL: req.SourceURL,
        Source:    "youtube",                          // ADD: explicit source type
        Status:    models.JobStatusPending,
        CreatedAt: now,
        UpdatedAt: now,
    }
    res, err := database.Collection(db.CollJobs).InsertOne(ctx, job)  // CHANGE: _ to res
    if err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to create job"}) //nolint:errcheck
        return
    }
    job.ID = res.InsertedID.(bson.ObjectID)            // ADD: extract inserted ID
    worker.Enqueue(worker.JobRequest{                   // ADD: enqueue for processing
        JobID:     job.ID,
        EpisodeID: episode.ID,
        SourceURL: req.SourceURL,
        Source:    "youtube",
    })
    statusCode = http.StatusAccepted
}
```

### Complete Fix for RetryJob (job.go, after UpdateOne)

```go
// Source: backend/internal/handler/job.go — after existing UpdateOne block
_, err = database.Collection(db.CollJobs).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
if err != nil {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(map[string]string{"error": "failed to retry job"}) //nolint:errcheck
    return
}

// ADD: re-enqueue the job for processing
worker.Enqueue(worker.JobRequest{
    JobID:     job.ID,
    EpisodeID: job.EpisodeID,
    SourceURL: job.SourceURL,
    Source:    job.Source,
})

job.Status = models.JobStatusPending
job.Error = ""
job.UpdatedAt = now
// ... rest of handler unchanged
```

### Import Addition (both episode.go and job.go)

```go
import (
    "encoding/json"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/hadi/kidtube/internal/db"
    "github.com/hadi/kidtube/internal/models"
    "github.com/hadi/kidtube/internal/worker"    // ADD
    "go.mongodb.org/mongo-driver/v2/bson"
    "go.mongodb.org/mongo-driver/v2/mongo"
)
```

### Smoke Test Commands (inside Docker Compose)

```bash
# Start the stack
docker compose up -d

# Tail admin-api logs
docker compose logs admin-api -f

# Verify worker processes a real YouTube URL (need admin JWT first)
# Login:
curl -s -c cookies.txt -X POST http://localhost/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kidtube.test","password":"adminpass123"}' | jq .

# Create episode with YouTube URL:
curl -s -b cookies.txt -X POST http://localhost/api/admin/episodes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"channel_id":"<CHANNEL_ID>","title":"Test","order":1,"source_url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' | jq .

# Watch job status transition:
curl -s -H "Authorization: Bearer <TOKEN>" http://localhost/api/admin/jobs | jq '.[0]'

# Verify HLS files exist after job completes:
docker compose exec admin-api ls /data/hls/<EPISODE_ID>/
# Expected: master.m3u8  0/  1/  2/

# Verify nginx serves HLS:
curl -I http://localhost/hls/<EPISODE_ID>/master.m3u8
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ResumeJobs only on restart | Enqueue immediately on create + retry (this phase) | Phase 6 | Jobs start immediately; no restart needed to process new submissions |

**Deprecated/outdated:**
- Relying on `ResumeJobs` as the sole job activation path: before this fix, the only way a YouTube job ever processed was if the server restarted with a pending job in MongoDB. This accidental behavior masked the defect during development. After this fix, `ResumeJobs` becomes a fallback for crash recovery only (its correct role).

## Open Questions

1. **Short YouTube video for smoke test**
   - What we know: The fix can be validated with any public YouTube URL; yt-dlp with `--no-playlist` and `--sleep-requests 5` flags is already configured.
   - What's unclear: Whether there is a known-short public video to use for fast testing in the development environment.
   - Recommendation: Use a short YouTube video (< 60 seconds) for smoke test to avoid long download wait. The exact URL doesn't affect code correctness.

2. **Concurrent retry and normal processing**
   - What we know: The worker is a single sequential goroutine — jobs process one at a time. The channel is buffered at 100.
   - What's unclear: If a job is already in the worker channel (re-queued by ResumeJobs) and RetryJob is called on the same job, two entries exist in the channel for the same job ID. The second run would overwrite MongoDB status updates from the first.
   - Recommendation: This is an edge case only possible in a crash-recovery scenario combined with a manual retry, and the system already had this behavior with ResumeJobs. It is acceptable for v1. No action needed.

## Validation Architecture

> `workflow.nyquist_validation` is not present in config.json — skipping this section.

(config.json has `workflow.research: true` and `workflow.verifier: false` but no `nyquist_validation` key — treating as disabled.)

## Sources

### Primary (HIGH confidence)

- `backend/internal/handler/episode.go` — exact line numbers for the missing Enqueue call; confirmed by reading file
- `backend/internal/handler/job.go` — exact location of missing Enqueue; confirmed by reading file
- `backend/internal/handler/upload.go` — the correct established pattern; confirmed by reading file
- `backend/internal/worker/processor.go` — Enqueue signature, JobRequest type, channel definition, Source field semantics; confirmed by reading file
- `backend/internal/models/job.go` — Job struct with Source field; confirmed by reading file
- `.planning/v1.0-MILESTONE-AUDIT.md` — authoritative defect description with exact fix recommendations; confirmed by reading file
- `backend/cmd/admin-api/main.go` — worker.Start and handler wiring; confirmed by reading file
- `backend/Dockerfile` — yt-dlp and FFmpeg presence in admin-api image; confirmed by reading file
- `docker-compose.yml` and `nginx/nginx.conf` — HLS volume mounts and serving; confirmed by reading files

### Secondary (MEDIUM confidence)

- None needed — all required information is in the local codebase.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all code is in the local codebase and fully readable
- Architecture: HIGH — exact line-level changes identified; upload.go provides the verified template
- Pitfalls: HIGH — defects precisely identified by the audit; edge cases reasoned from reading source

**Research date:** 2026-03-01
**Valid until:** This research is based purely on local source code — valid until the files it references change.
