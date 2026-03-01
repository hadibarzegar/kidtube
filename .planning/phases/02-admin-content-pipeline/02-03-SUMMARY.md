---
phase: 02-admin-content-pipeline
plan: "03"
subsystem: api
tags: [go, worker, yt-dlp, ffmpeg, hls, mongodb, goroutine]

requires:
  - phase: 02-admin-content-pipeline
    provides: JWT auth, admin-api Docker infra, MongoDB job/episode models
  - phase: 01-foundation-infrastructure
    provides: MongoDB models (Job, Episode), db collection names, nginx HLS volume

provides:
  - Sequential ingestion worker (single goroutine + buffered channel) in backend/internal/worker/processor.go
  - yt-dlp download with --sleep-requests 5 and --no-playlist for 429 protection
  - FFmpeg multi-rendition HLS transcode (720p, 480p, 360p) with force_key_frames and master.m3u8
  - Job status lifecycle in MongoDB (downloading -> transcoding -> ready/failed)
  - Episode status updated to "ready" after successful transcode
  - ResumeJobs() for picking up pending/in-progress jobs on server restart
  - Worker started in admin-api main.go with HLS_ROOT env var and graceful shutdown

affects: [02-02-episode-handler, 03-site-api, 04-video-player]

tech-stack:
  added: []
  patterns:
    - "Single-goroutine buffered channel worker for sequential job processing"
    - "exec.CommandContext for yt-dlp and FFmpeg subprocess invocation with stderr capture"
    - "force_key_frames expr:gte(t,n_forced*6) for fps-agnostic HLS keyframe alignment"
    - "updateJobStatusWithTime helper for setting started_at and completed_at timestamps"

key-files:
  created:
    - backend/internal/worker/processor.go
  modified:
    - backend/cmd/admin-api/main.go

key-decisions:
  - "Use -force_key_frames expr:gte(t,n_forced*6) instead of -g 180 for fps-agnostic keyframe alignment (YouTube videos can be 24/25/30/60fps)"
  - "Capture yt-dlp and ffmpeg stderr into bytes.Buffer for rich error messages stored in Job.Error"
  - "Cancel workerCtx before srv.Shutdown so in-progress job can detect cancellation during graceful shutdown"
  - "ResumeJobs resets in-progress jobs to pending and re-enqueues them (handles crash/restart mid-job)"
  - "Episode handler (Plan 02) calls worker.Enqueue directly after inserting Job document (Option A from plan)"

patterns-established:
  - "Pattern: worker.Enqueue(worker.JobRequest{...}) called from episode CREATE handler after MongoDB job insert"
  - "Pattern: HLS output path: {HLS_ROOT}/{episode_id}/{rendition}/seg%03d.ts with master.m3u8 in episode dir"

requirements-completed: [VIDE-02, VIDE-03, VIDE-06]

duration: 3min
completed: 2026-03-01
---

# Phase 2 Plan 03: Sequential Ingestion Worker Summary

**Single-goroutine buffered-channel worker that downloads via yt-dlp and transcodes to three HLS renditions (720p/480p/360p) via FFmpeg with fps-agnostic keyframe alignment and master.m3u8**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T05:43:35Z
- **Completed:** 2026-03-01T05:46:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Worker package with Start/Enqueue/ResumeJobs API; single goroutine never processes concurrent downloads, avoiding YouTube 429s
- yt-dlp subprocess with --sleep-requests 5 and --no-playlist; stderr captured for rich error reporting in Job.Error
- FFmpeg multi-rendition HLS with -force_key_frames "expr:gte(t,n_forced*6)" for correct keyframe alignment across variable-fps YouTube sources
- Job status updated at every pipeline step; source.mp4 deleted after successful transcode
- Worker wired into admin-api main.go with HLS_ROOT env var and cancel-before-shutdown ordering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create worker package** - `906b6e9` (feat)
2. **Task 2: Wire worker into admin-api main.go** - `3b60645` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified

- `backend/internal/worker/processor.go` - Sequential job queue worker with yt-dlp download and FFmpeg HLS transcode; exports Start, Enqueue, ResumeJobs, JobRequest
- `backend/cmd/admin-api/main.go` - Added worker import, HLS_ROOT env var read, worker.Start(), worker.ResumeJobs(), and cancel-before-shutdown pattern

## Decisions Made

- Used `-force_key_frames "expr:gte(t,n_forced*6)"` instead of `-g 180` because YouTube sources vary from 24 to 60fps and a fixed GOP size would misalign HLS segments
- Stderr captured into `bytes.Buffer` (not piped to os.Stderr) so the full error string can be stored in `Job.Error` for the admin panel to display
- Worker context cancelled before HTTP server shutdown so in-progress yt-dlp/ffmpeg processes receive context cancellation signals
- `ResumeJobs` resets downloading/transcoding jobs back to pending before re-enqueueing — ensures clean restart from beginning of pipeline rather than mid-step

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added fmt import missing from transcodeHLS error wrapping**
- **Found during:** Task 1 (worker package creation)
- **Issue:** Used `fmt.Errorf` in transcodeHLS to wrap stderr output but forgot to include `fmt` in import block
- **Fix:** Added `"fmt"` to the import block before running go vet
- **Files modified:** backend/internal/worker/processor.go
- **Verification:** `go vet ./internal/worker/...` passed
- **Committed in:** 906b6e9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing import)
**Impact on plan:** Trivial fix needed for compilation. No scope creep.

## Issues Encountered

None — plan executed smoothly. The plan's note about episode.go not existing (Plan 02 runs in parallel on Wave 2) was handled as specified: added a TODO comment in main.go for the episode handler to call `worker.Enqueue`.

## User Setup Required

None - no external service configuration required beyond what was specified in Plan 01 (HLS_ROOT env var and docker-compose.yml volume mount documented in RESEARCH.md).

## Next Phase Readiness

- Worker is fully operational and ready for Plan 02 (episode handler) to call `worker.Enqueue(worker.JobRequest{...})` after inserting a Job document
- HLS segments will be written to `{HLS_ROOT}/{episode_id}/` directory served by nginx at `/hls/{episode_id}/master.m3u8`
- Episode status transitions to "ready" after successful transcode — Plan 03 (site API) can filter `status == "ready"` episodes for public display

---
*Phase: 02-admin-content-pipeline*
*Completed: 2026-03-01*
