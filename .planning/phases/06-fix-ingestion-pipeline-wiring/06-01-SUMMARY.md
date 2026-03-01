---
phase: 06-fix-ingestion-pipeline-wiring
plan: 01
subsystem: api
tags: [go, worker, mongodb, youtube, ingestion, jobs]

requires:
  - phase: 05-polish-and-operations
    provides: Job.Source field and worker.Enqueue pattern established in upload.go

provides:
  - CreateEpisode handler calls worker.Enqueue after Job insert so YouTube URL submissions immediately start processing
  - RetryJob handler calls worker.Enqueue after status reset so retried jobs immediately start processing
  - YouTube-source jobs have Source field set to "youtube" explicitly

affects: [ingestion-pipeline, worker, jobs-admin-ui]

tech-stack:
  added: []
  patterns:
    - "handler -> InsertOne -> capture InsertedID -> worker.Enqueue(JobRequest) for fire-and-forget async processing"

key-files:
  created: []
  modified:
    - backend/internal/handler/episode.go
    - backend/internal/handler/job.go

key-decisions:
  - "Use job.Source (from fetched MongoDB document) not hardcoded 'youtube' in RetryJob so upload jobs also enqueue correctly on retry"
  - "worker.Enqueue is NOT wrapped in a goroutine — channel is buffered at 100 and call is already non-blocking by design"
  - "worker.Enqueue called AFTER successful DB insert — worker updates job status by ID in MongoDB so document must exist first"

patterns-established:
  - "Enqueue pattern: InsertOne -> capture res.InsertedID -> set job.ID -> worker.Enqueue(JobRequest{...})"

requirements-completed: [VIDE-01, VIDE-02, VIDE-03, VIDE-05, VIDE-06, PLAY-01]

duration: 1min
completed: 2026-03-01
---

# Phase 06 Plan 01: Fix Ingestion Pipeline Wiring Summary

**worker.Enqueue wired into CreateEpisode (source="youtube") and RetryJob (source=job.Source) handlers, closing the critical defect where Job documents were inserted into MongoDB but never dispatched to the worker goroutine**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T13:14:37Z
- **Completed:** 2026-03-01T13:15:26Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- CreateEpisode now enqueues YouTube URL jobs immediately on submission — yt-dlp download and FFmpeg transcode start without server restart
- RetryJob now enqueues failed jobs immediately on retry — uses `job.Source` from the fetched document so both youtube and upload jobs retry correctly
- Job struct in CreateEpisode now has `Source: "youtube"` set explicitly, aligning YouTube-origin jobs with the data model

## Task Commits

1. **Task 1: Wire worker.Enqueue into CreateEpisode and RetryJob handlers** - `81c0688` (fix)

**Plan metadata:** _(docs commit pending)_

## Files Created/Modified

- `backend/internal/handler/episode.go` - Added worker import, Source="youtube" on Job struct, InsertedID capture, worker.Enqueue call after Job insert
- `backend/internal/handler/job.go` - Added worker import, worker.Enqueue call after UpdateOne in RetryJob using job.Source from fetched document

## Decisions Made

- Used `job.Source` (not hardcoded `"youtube"`) in RetryJob so upload-origin jobs also re-enqueue correctly when retried
- worker.Enqueue not wrapped in goroutine — the channel is buffered at 100 and the call is non-blocking by design (matches upload.go pattern)
- Enqueue placed after successful DB operation — worker reads job from MongoDB by ID so document must exist before dispatch

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ingestion pipeline is now fully wired end-to-end: YouTube URL submission -> Episode insert -> Job insert (source="youtube") -> worker.Enqueue -> worker goroutine processes immediately
- RetryJob path also fully wired: failed job retry -> status reset -> worker.Enqueue(source=job.Source) -> worker goroutine re-processes
- Both paths match the established pattern from upload.go
- No blockers for further phases

## Self-Check: PASSED

- episode.go: FOUND
- job.go: FOUND
- 06-01-SUMMARY.md: FOUND
- Commit 81c0688: FOUND

---
*Phase: 06-fix-ingestion-pipeline-wiring*
*Completed: 2026-03-01*
