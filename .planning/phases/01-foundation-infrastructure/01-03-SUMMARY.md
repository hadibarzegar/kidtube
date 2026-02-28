---
phase: 01-foundation-infrastructure
plan: 03
subsystem: api
tags: [go, chi, mongodb, mongo-driver-v2, health-check, middleware]

# Dependency graph
requires:
  - phase: 01-02
    provides: Go module with chi/v5 and mongo-driver v2, db.Connect and db.EnsureIndexes, cmd/site-api and cmd/admin-api skeletons
provides:
  - internal/handler package with HealthHandler function
  - /healthz endpoint on both site-api (8081) and admin-api (8082) with MongoDB ping
  - middleware.RequestID added to both routers
affects:
  - 01-04 (Docker Compose — health check endpoint enables Docker HEALTHCHECK directives)
  - 02 (API endpoints — internal/handler package is now established for future handlers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Handler functions live in internal/handler package — not inlined in main.go
    - HealthHandler accepts *mongo.Database dependency (no global state)
    - Chi middleware order: RequestID → Logger → Recoverer
    - Health check pings MongoDB using request context (respects client timeout)
    - 503 returned when MongoDB unreachable, 200 when healthy

key-files:
  created:
    - backend/internal/handler/health.go
  modified:
    - backend/cmd/site-api/main.go
    - backend/cmd/admin-api/main.go

key-decisions:
  - "HealthHandler accepts *mongo.Database not *mongo.Client — handler operates at database level consistent with all other handlers"
  - "503 on MongoDB ping failure — health check signals true service health, not just process liveness"
  - "middleware.RequestID added to both routers — required for distributed tracing correlation in logs"

patterns-established:
  - "All HTTP handlers live in internal/handler package — never inline anonymous functions in main.go for real routes"
  - "Health endpoint pings MongoDB on every request — proves full request path including DB connectivity"
  - "w.WriteHeader before w.Header().Set is intentional: 503 set before headers when DB unreachable"

requirements-completed: [INFRA-05]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 1 Plan 03: Chi Router Wiring and Health Check Handler Summary

**Dedicated HealthHandler in internal/handler package with MongoDB ping, wired into both chi routers with RequestID/Logger/Recoverer middleware stack**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T21:10:04Z
- **Completed:** 2026-02-28T21:11:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `internal/handler` package with `HealthHandler(db *mongo.Database) http.HandlerFunc` — pings MongoDB on every call, returns 200 or 503 with JSON body
- Replaced inline anonymous health handlers in both main.go files with the shared `handler.HealthHandler(database)`
- Added `middleware.RequestID` to both chi routers (was missing from the plan 01-02 skeleton)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create health check handler with MongoDB ping** - `94596d6` (feat)
2. **Task 2: Wire routers and MongoDB connection in both main.go binaries** - `b18fae3` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/internal/handler/health.go` - HealthHandler accepting *mongo.Database, pings on each request, returns JSON with status/db/time fields
- `backend/cmd/site-api/main.go` - Replaced inline healthz handler with handler.HealthHandler, added middleware.RequestID, removed unused encoding/json import
- `backend/cmd/admin-api/main.go` - Same changes as site-api, port 8082

## Decisions Made
- `HealthHandler` accepts `*mongo.Database` (not `*mongo.Client`) — consistent with how all future handlers will receive their DB dependency
- HTTP 503 returned when MongoDB ping fails — signals true degraded state to Docker and load balancers, not just "process is alive"
- `middleware.RequestID` added despite not being in the original plan skeleton — required for log correlation and follows chi standard practice

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused encoding/json import from both main.go files**
- **Found during:** Task 2 (replacing inline handler with handler.HealthHandler)
- **Issue:** Removing the inline handler left `encoding/json` imported but unused — Go compiler rejects this
- **Fix:** Removed `"encoding/json"` from import block in both cmd/site-api/main.go and cmd/admin-api/main.go
- **Files modified:** backend/cmd/site-api/main.go, backend/cmd/admin-api/main.go
- **Verification:** `go build ./cmd/site-api && go build ./cmd/admin-api` — BUILD OK; `go vet ./...` — exit 0
- **Committed in:** b18fae3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — stale import)
**Impact on plan:** Necessary cleanup from removing inline handlers. No scope creep.

## Issues Encountered
None — build succeeded on first attempt after import cleanup.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both Go binaries compile and link correctly with all planned imports
- `/healthz` endpoint returns 200+JSON when MongoDB is reachable, 503 when not — Docker HEALTHCHECK directives can target this
- `internal/handler` package is established — future handlers (channels, episodes, auth) follow the same pattern
- EnsureIndexes runs at startup — services are index-ready before serving traffic

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-03-01*

## Self-Check: PASSED

All files verified present on disk. All commits verified in git history.
- FOUND: backend/internal/handler/health.go
- FOUND: backend/cmd/site-api/main.go
- FOUND: backend/cmd/admin-api/main.go
- FOUND: .planning/phases/01-foundation-infrastructure/01-03-SUMMARY.md
- FOUND: commit 94596d6 (Task 1 - health handler)
- FOUND: commit b18fae3 (Task 2 - main.go wiring)
