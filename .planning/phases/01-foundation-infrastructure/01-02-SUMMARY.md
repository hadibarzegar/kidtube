---
phase: 01-foundation-infrastructure
plan: 02
subsystem: api
tags: [go, mongodb, mongo-driver-v2, chi, docker, bson]

# Dependency graph
requires: []
provides:
  - Go module at github.com/hadi/kidtube with chi router and mongo-driver v2
  - Two compiled binary entry points: cmd/site-api (port 8081) and cmd/admin-api (port 8082)
  - MongoDB connection package with Connect and EnsureIndexes functions
  - Six typed model structs: Channel, Episode, Category, AgeGroup, User, Job
  - MongoDB init script creating 6 collections, 7 indexes, and seed data
affects:
  - 01-03 (Docker Compose — depends on site-api and admin-api build targets)
  - 02 (API endpoints — uses model structs and db package)
  - 03 (Video pipeline — uses Job and Episode models)

# Tech tracking
tech-stack:
  added:
    - go.mongodb.org/mongo-driver/v2 v2.5.0
    - github.com/go-chi/chi/v5 v5.2.5
  patterns:
    - Typed Go structs with bson tags for all MongoDB documents (never bson.M)
    - bson.ObjectID (not primitive.ObjectID — mongo-driver v2 moved ObjectID to bson package)
    - EnsureIndexes called on startup from main.go
    - Graceful shutdown with SIGINT/SIGTERM and 10s timeout in both binaries
    - Multi-stage Dockerfile with separate build targets for site-api and admin-api

key-files:
  created:
    - backend/go.mod
    - backend/go.sum
    - backend/Dockerfile
    - backend/cmd/site-api/main.go
    - backend/cmd/admin-api/main.go
    - backend/internal/db/mongo.go
    - backend/internal/models/channel.go
    - backend/internal/models/episode.go
    - backend/internal/models/category.go
    - backend/internal/models/age_group.go
    - backend/internal/models/user.go
    - backend/internal/models/job.go
    - mongo/init.js
  modified:
    - .gitignore

key-decisions:
  - "bson.ObjectID instead of primitive.ObjectID: mongo-driver v2 moved ObjectID to bson package — bson/primitive subpackage does not exist in v2"
  - "HLS path derived by convention /hls/{episode_id}/master.m3u8 — no explicit path field on Episode struct"
  - "AgeGroup stored as documents (admin-defined) not hardcoded enums — allows custom ranges"
  - "PasswordHash has json:\"-\" tag — never serialized to JSON responses"

patterns-established:
  - "All MongoDB document IDs use bson.ObjectID (mongo-driver v2 bson package)"
  - "All model timestamps use time.Time with bson tags"
  - "No raw bson.M maps anywhere in Go source — decode into typed structs only"
  - "EnsureIndexes called at startup before serving requests"
  - "Both main.go binaries follow identical pattern: read env, connect DB, ensure indexes, start chi router, graceful shutdown"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 1 Plan 02: Go Backend Project Structure and MongoDB Models Summary

**Go monorepo with two chi-based binaries sharing internal packages, six typed bson-tagged model structs, and MongoDB init script with 7 indexes and Persian seed data**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T20:59:38Z
- **Completed:** 2026-02-28T21:04:35Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Go module initialized with mongo-driver v2 and chi/v5 — both binaries compile and pass go vet
- Six typed model structs covering all domain entities with proper bson/json tags, no raw bson.M
- MongoDB init script creates 6 collections with 7 indexes (including unique email) and seeds age groups + Persian categories
- Multi-stage Dockerfile with separate site-api and admin-api build targets for Docker Compose consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Go module, project structure, and Dockerfile** - `614195b` (feat)
2. **Task 2: Create MongoDB models, connection package, and init script** - `0b9a5b0` + `9e0daff` (feat)

Note: Task 2 required a corrective commit (9e0daff) because model files were not captured in the initial commit (0b9a5b0 only captured admin-app files from plan 01 that were untracked).

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/go.mod` - Go module definition at github.com/hadi/kidtube
- `backend/go.sum` - Dependency checksums
- `backend/Dockerfile` - Multi-stage build with site-api and admin-api targets on alpine:3.19
- `backend/cmd/site-api/main.go` - Site API binary (port 8081) with healthz, chi router, graceful shutdown
- `backend/cmd/admin-api/main.go` - Admin API binary (port 8082) with same structure
- `backend/internal/db/mongo.go` - Connect() and EnsureIndexes() functions using mongo-driver v2
- `backend/internal/models/channel.go` - Channel struct with CategoryIDs/AgeGroupIDs slice references
- `backend/internal/models/episode.go` - Episode struct with ChannelID, Order, Status (HLS path by convention)
- `backend/internal/models/category.go` - Category struct for content classification
- `backend/internal/models/age_group.go` - AgeGroup struct with MinAge/MaxAge (admin-defined)
- `backend/internal/models/user.go` - User struct with PasswordHash hidden from JSON
- `backend/internal/models/job.go` - Job struct with JobStatus constants and pointer timestamps
- `mongo/init.js` - Collection creation, 7 indexes, seed age groups + 3 Persian categories
- `.gitignore` - Added backend/site-api and backend/admin-api binary paths

## Decisions Made
- **bson.ObjectID vs primitive.ObjectID:** mongo-driver v2 eliminated the `bson/primitive` subpackage. `ObjectID` now lives directly in the `bson` package. Had to update all model imports after discovering the compile error.
- **Job.Error as string:** Empty string when no error (not a pointer), avoids nil checks in handlers.
- **StartedAt/CompletedAt as *time.Time:** Pointer allows omitempty in BSON, avoiding zero-time storage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect primitive.ObjectID import path for mongo-driver v2**
- **Found during:** Task 2 (creating model files)
- **Issue:** Plan specified `go.mongodb.org/mongo-driver/v2/bson/primitive` which does not exist in v2 — go mod tidy failed with "module found but does not contain package"
- **Fix:** Used `go.mongodb.org/mongo-driver/v2/bson` and `bson.ObjectID` directly (v2 merged primitive types into the bson package)
- **Files modified:** All 6 model files, plus db/mongo.go already used correct bson.D
- **Verification:** go mod tidy, go vet, go build all pass cleanly
- **Committed in:** 0b9a5b0 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added backend binary names to .gitignore**
- **Found during:** Task 1 (building and verifying)
- **Issue:** .gitignore had *.exe and *.out but not bare Unix binary names backend/site-api and backend/admin-api
- **Fix:** Added both binary paths to .gitignore to prevent accidental commits
- **Files modified:** .gitignore
- **Verification:** git status shows binaries as ignored after build
- **Committed in:** 614195b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correct compilation and repository hygiene. No scope creep.

## Issues Encountered
- admin-app directory (from plan 01-01) was untracked and was swept into the Task 2 commit via git's staging behavior. The files are valid project code from the prior plan — no correctness impact.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Go backend structure ready for API endpoint implementation (Phase 2)
- Model structs define the MongoDB contract — all future handlers decode into these types
- EnsureIndexes runs at startup — no manual index creation needed
- mongo/init.js ready to mount in Docker Compose via docker-entrypoint-initdb.d

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-03-01*

## Self-Check: PASSED

All files verified present on disk. All commits verified in git history.
- FOUND: backend/go.mod
- FOUND: backend/Dockerfile
- FOUND: backend/cmd/site-api/main.go
- FOUND: backend/cmd/admin-api/main.go
- FOUND: backend/internal/db/mongo.go
- FOUND: all 6 model files in backend/internal/models/
- FOUND: mongo/init.js
- FOUND: commit 614195b (Task 1)
- FOUND: commit 0b9a5b0 (Task 2 - admin-app files)
- FOUND: commit 9e0daff (Task 2 corrective - model files and mongo/init.js)
