---
phase: 05-polish-and-operations
plan: 01
subsystem: api
tags: [go, multipart-upload, nginx, ffmpeg, hls, mongodb, worker]

# Dependency graph
requires:
  - phase: 02-admin-content-pipeline
    provides: worker processor (processJob, Enqueue, JobRequest), Job model, Episode model

provides:
  - Job model Source field ("youtube" | "upload") for ingestion path distinction
  - UploadEpisode multipart handler streaming video file to disk without memory buffering
  - Upload-aware processJob that skips yt-dlp when Source=="upload"
  - POST /episodes/upload route wired in admin-api (JWT-protected)
  - nginx exact-match location for /api/admin/episodes/upload with 2100m body limit

affects:
  - 05-02-PLAN.md (admin upload UI will POST to this endpoint)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Streaming multipart via r.MultipartReader() + io.Copy — avoids buffering 2GB files
    - Pre-allocate episodeID before multipart loop to know output path upfront
    - Source field on Job/JobRequest to distinguish ingestion path (youtube vs upload)
    - nginx exact-match location (=) before prefix location for per-endpoint body size control

key-files:
  created:
    - backend/internal/handler/upload.go
  modified:
    - backend/internal/models/job.go
    - backend/internal/worker/processor.go
    - backend/cmd/admin-api/main.go
    - nginx/nginx.conf

key-decisions:
  - "Source field on Job struct (not a separate collection) distinguishes youtube vs upload ingestion paths cleanly without schema complexity"
  - "http.MaxBytesReader + r.MultipartReader() + io.Copy pattern streams file directly to disk — never buffers 2GB in memory or temp files"
  - "Exact-match nginx location (= /api/admin/episodes/upload) before prefix location avoids setting client_max_body_size globally, limiting attack surface on other endpoints"
  - "writeJSONError helper in upload.go avoids duplication within the upload handler without adding a package-level utility (other handlers inline JSON errors)"
  - "Close file dst explicitly (not defer) before responding to detect write errors that would leave a corrupt source.mp4 on disk"

patterns-established:
  - "Upload handler pattern: pre-allocate ObjectID -> MkdirAll outDir -> MultipartReader loop -> validate -> insert docs -> enqueue"
  - "Cleanup pattern: os.RemoveAll(outDir) on any error before file write succeeds; skip cleanup after file write so worker can transcode"

requirements-completed:
  - VIDE-07

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 05 Plan 01: Video File Upload Backend Summary

**Streaming multipart upload endpoint for 2GB video files via Go multipart reader + nginx exact-match proxy, with upload-aware worker that skips yt-dlp and proceeds directly to FFmpeg transcoding**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T12:17:25Z
- **Completed:** 2026-03-01T12:19:30Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Job model extended with Source field enabling ingestion path distinction (youtube vs upload) throughout the pipeline
- New UploadEpisode handler streams multipart video directly to `{hlsRoot}/{episodeID}/source.mp4` using `io.Copy` — never buffers 2GB in memory
- Worker's `processJob` now conditionally skips yt-dlp download steps when `req.Source == "upload"`, proceeding directly to FFmpeg transcode
- nginx upload proxy location configured with `client_max_body_size 2100m`, 600s timeouts, and `proxy_request_buffering off` for true streaming

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Source field to Job model and JobRequest, update worker** - `da51833` (feat)
2. **Task 2: Create UploadEpisode multipart handler and wire route** - `d027e12` (feat)
3. **Task 3: Configure nginx upload proxy location** - `999e47a` (feat)

## Files Created/Modified
- `backend/internal/models/job.go` - Added `Source string` field (bson:"source", json:"source") after SourceURL
- `backend/internal/worker/processor.go` - Added Source to JobRequest; wrapped yt-dlp steps in `if req.Source != "upload"` guard; ResumeJobs passes Source on re-enqueue
- `backend/internal/handler/upload.go` - New file: streaming multipart upload handler with MaxBytesReader, MultipartReader, io.Copy, Episode+Job creation, worker.Enqueue
- `backend/cmd/admin-api/main.go` - Added `r.Post("/upload", handler.UploadEpisode(database, hlsRoot))` in /episodes route group
- `nginx/nginx.conf` - Added exact-match location for /api/admin/episodes/upload before generic /api/admin/ block

## Decisions Made
- **Source field on Job struct (not separate collection):** Keeps ingestion path distinction in the existing Job document; no schema complexity added. Sufficient for current needs and queryable in admin UI.
- **http.MaxBytesReader + r.MultipartReader() + io.Copy:** True streaming approach — nginx streams to Go which streams to disk. No temp file buffering. Essential for 2GB files under Docker memory constraints.
- **nginx exact-match location (`=`) before prefix location:** Per-endpoint body size control avoids creating a global large-body attack surface. The exact-match `=` takes priority over the prefix `/api/admin/` for the upload path only.
- **Close file dst explicitly before responding:** `defer dst.Close()` would execute after the return statements, preventing error detection. Explicit close lets us check for write errors (e.g., disk full) before responding 202.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all three tasks compiled and passed nginx validation on the first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- POST /episodes/upload endpoint is live and accepts JWT-authenticated multipart uploads
- Worker correctly skips yt-dlp for upload-sourced jobs and goes directly to FFmpeg transcode
- nginx proxy handles body size and timeouts for 2GB uploads
- Plan 05-02 (admin upload UI) can now POST to `/api/admin/episodes/upload` with `multipart/form-data`

---
*Phase: 05-polish-and-operations*
*Completed: 2026-03-01*

## Self-Check: PASSED

All files verified present and all task commits confirmed in git history.
