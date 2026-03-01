---
phase: 02-admin-content-pipeline
plan: "02"
subsystem: api
tags: [go, chi, mongodb, crud, rest, bson, yt-dlp, jobs]

# Dependency graph
requires:
  - phase: 02-admin-content-pipeline
    plan: "01"
    provides: JWT auth, admin-api Docker infrastructure, seed binary
provides:
  - Full CRUD REST handlers for channels, categories, age groups, episodes, jobs
  - YouTube metadata pre-fetch endpoint (yt-dlp integration)
  - Job creation trigger on episode ingest (source_url -> pending Job document)
  - All admin-api routes wired in JWT-protected chi route group
affects:
  - 02-03-ingestion-worker (picks up Job documents created here)
  - 02-04-admin-ui (consumes all REST endpoints built here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dependency-injection handler pattern: func Accept(*mongo.Database) http.HandlerFunc"
    - "Empty slice initialization (make([]T, 0)) to ensure JSON [] not null on list endpoints"
    - "chi.URLParam(r, 'id') for path parameters"
    - "bson.ObjectIDFromHex for hex string to ObjectID parsing with 400 on invalid"
    - "Episode create returns 202 Accepted when job is also created, 201 Created otherwise"

key-files:
  created:
    - backend/internal/handler/channel.go
    - backend/internal/handler/category.go
    - backend/internal/handler/age_group.go
    - backend/internal/handler/episode.go
    - backend/internal/handler/youtube.go
    - backend/internal/handler/job.go
  modified:
    - backend/cmd/admin-api/main.go

key-decisions:
  - "Episode CreateEpisode returns 202 Accepted (not 201) when source_url triggers Job creation to signal async processing"
  - "ListJobs sorts by created_at descending (most recent first) for job queue monitoring"
  - "YouTubeMeta returns 502 Bad Gateway when yt-dlp fails (not 500) since failure is upstream dependency"
  - "AgeGroup validation: min_age >= 0 AND min_age < max_age — both zero is invalid (no zero-width range)"
  - "UpdateChannel fully replaces category_ids and age_group_ids arrays on each PUT (no partial patch)"
  - "RetryJob only permits retry when job.Status == 'failed'; returns 400 for all other states"

patterns-established:
  - "Error response format: {\"error\": \"message\"} with appropriate HTTP status on all handlers"
  - "Content-Type: application/json header set on all responses including errors"
  - "Handlers return 404 when MatchedCount/DeletedCount == 0 (not just on find failure)"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, VIDE-01, VIDE-04, VIDE-05]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 2 Plan 02: Admin REST API CRUD Handlers Summary

**Six Go handler files providing full CRUD REST API for channels, categories, age groups, episodes (with Job creation trigger), YouTube metadata pre-fetch via yt-dlp, and job list/retry — all wired into the JWT-protected chi route group.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T05:43:23Z
- **Completed:** 2026-03-01T05:47:02Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Channel, Category, and AgeGroup CRUD handlers with proper validation (age range min < max, hex ID parsing)
- Episode handler with channel_id filter on list, automatic Job document creation on source_url (returns 202)
- YouTube metadata handler calling yt-dlp --dump-json --no-playlist; returns 502 on yt-dlp failure
- Job handler with status-filtered list (sorted newest first), get by ID, and retry (failed -> pending)
- All routes wired into JWT-protected group in admin-api main.go

## Task Commits

Each task was committed atomically:

1. **Task 1: Channel, Category, and AgeGroup CRUD handlers** - `0c61e39` (feat)
2. **Task 2: Episode, YouTube meta, and Job handlers; wire all routes** - `b3fcc1d` (feat)

## Files Created/Modified

- `backend/internal/handler/channel.go` - Channel CRUD with category_ids and age_group_ids assignment
- `backend/internal/handler/category.go` - Category CRUD (name-only)
- `backend/internal/handler/age_group.go` - AgeGroup CRUD with min_age/max_age validation
- `backend/internal/handler/episode.go` - Episode CRUD with Job creation on source_url
- `backend/internal/handler/youtube.go` - YouTube metadata pre-fetch via yt-dlp
- `backend/internal/handler/job.go` - Job list (status filter + sorted), get, retry
- `backend/cmd/admin-api/main.go` - All routes wired in JWT-protected group

## Decisions Made

- Episode CreateEpisode returns 202 Accepted when source_url triggers Job creation to signal async processing to callers
- ListJobs sorts by created_at descending (most recent first) for job queue monitoring UX
- YouTubeMeta returns 502 Bad Gateway when yt-dlp fails (not 500) since failure is an upstream dependency issue
- AgeGroup validation: min_age >= 0 AND min_age < max_age (zero-width ranges rejected)
- UpdateChannel fully replaces category_ids/age_group_ids arrays on PUT (standard REST semantics)
- RetryJob only permits retry when status == "failed"; returns 400 for pending/downloading/transcoding/ready

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The main.go file had already been modified by Plan 03 work (worker integration was pre-committed). The protected route group comment referenced future Plan 02 work. This was resolved by reading the current file state before editing and inserting the route wiring while preserving the worker infrastructure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All admin REST endpoints are now live in the JWT-protected group
- Episode creation with source_url creates Job documents — ingestion worker (Plan 03) will pick these up
- Admin UI (Plan 04) can consume all endpoints
- No blockers

## Self-Check: PASSED

- FOUND: backend/internal/handler/channel.go
- FOUND: backend/internal/handler/category.go
- FOUND: backend/internal/handler/age_group.go
- FOUND: backend/internal/handler/episode.go
- FOUND: backend/internal/handler/youtube.go
- FOUND: backend/internal/handler/job.go
- FOUND: .planning/phases/02-admin-content-pipeline/02-02-SUMMARY.md
- FOUND commit: 0c61e39 (Task 1)
- FOUND commit: b3fcc1d (Task 2)

---
*Phase: 02-admin-content-pipeline*
*Completed: 2026-03-01*
