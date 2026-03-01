---
phase: 02-admin-content-pipeline
plan: 01
subsystem: auth
tags: [jwt, jwtauth, bcrypt, ffmpeg, yt-dlp, mongodb, docker, seed]

# Dependency graph
requires:
  - phase: 01-foundation-infrastructure
    provides: MongoDB models, db.Connect, handler pattern, docker-compose base, chi router
provides:
  - JWT authentication via github.com/go-chi/jwtauth/v5 with HS256 signing
  - POST /auth/login endpoint validating admin credentials and returning signed JWT
  - Protected route group with jwtauth Verifier+Authenticator middleware on admin-api
  - Admin user seed binary (bcrypt password hash, MongoDB upsert)
  - yt-dlp and ffmpeg installed in admin-api Docker image
  - HLS volume mount and JWT_SECRET/HLS_ROOT env vars on admin-api
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added:
    - github.com/go-chi/jwtauth/v5 v5.4.0 (JWT middleware and token generation)
    - golang.org/x/crypto/bcrypt (password hashing in seed binary)
    - yt-dlp (Python package, installed via pip in Docker)
    - ffmpeg (installed via apk in Docker)
  patterns:
    - auth.Init() called explicitly from main() — not package-level init() for testability
    - IssueToken wraps jwtauth Encode; callers never touch JWTAuth directly
    - Protected route group uses r.Group with Verifier+Authenticator middleware pair
    - Seed binary uses $set/$setOnInsert upsert pattern for idempotent admin creation
    - Login handler follows HealthHandler DI pattern: accepts *mongo.Database, returns http.HandlerFunc

key-files:
  created:
    - backend/internal/auth/jwt.go
    - backend/internal/handler/auth.go
    - backend/cmd/seed/main.go
  modified:
    - backend/Dockerfile
    - docker-compose.yml
    - .env.example
    - backend/cmd/admin-api/main.go
    - backend/go.mod
    - backend/go.sum

key-decisions:
  - "seed binary is copied into admin-api Docker image alongside admin-api binary — run via: docker compose exec admin-api /bin/seed"
  - "auth.Init() called explicitly from main() (not package-level init) so it can be tested without setting JWT_SECRET globally"
  - "JWT uses HS256 with JWT_SECRET as symmetric key — sufficient for single-service admin API"
  - "Login handler returns 401 for both user-not-found and wrong-password (no credential enumeration)"
  - "go get github.com/xdg-go/stringprep applied to fix missing go.sum entry after jwtauth dependency upgrade"

patterns-established:
  - "Protected route group pattern: r.Group { r.Use(jwtauth.Verifier); r.Use(jwtauth.Authenticator) }"
  - "Admin seed: bcrypt hash + MongoDB $set/$setOnInsert upsert on email field"
  - "Auth package exports Init() and IssueToken() — callers never touch *jwtauth.JWTAuth directly"

requirements-completed: [ADMN-01, ADMN-02]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 2 Plan 01: JWT Auth, Seed Binary, and Admin-API Docker Infrastructure Summary

**JWT HS256 auth with bcrypt admin seeder, jwtauth middleware on admin-api, yt-dlp/ffmpeg in Docker, and HLS volume mount**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T05:36:38Z
- **Completed:** 2026-03-01T05:40:09Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Installed yt-dlp and ffmpeg in admin-api Docker image; seed binary co-located in same image
- Created JWT auth package (auth.Init, auth.IssueToken) and POST /auth/login handler with bcrypt credential check
- Wired jwtauth Verifier+Authenticator middleware on admin-api protected route group; /auth/login and /healthz remain public
- Created admin seed binary using bcrypt + MongoDB upsert for idempotent admin user creation
- Added HLS_ROOT, JWT_SECRET, and ADMIN_API_INTERNAL_URL env vars to docker-compose; added secrets to .env.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Dockerfile and docker-compose for Phase 2 infrastructure** - `21cd924` (chore)
2. **Task 2: Create JWT auth package and login handler** - `b205d8a` (feat)
3. **Task 3: Create admin seed command and wire JWT middleware in admin-api** - `4d3dbb7` (feat)

## Files Created/Modified
- `backend/internal/auth/jwt.go` - JWT init (Init()), token signing (IssueToken()), TokenAuth var
- `backend/internal/handler/auth.go` - Login handler: JSON decode, admin lookup, bcrypt compare, JWT issue
- `backend/cmd/seed/main.go` - Admin seeder: reads env vars, bcrypt hash, MongoDB $set/$setOnInsert upsert
- `backend/cmd/admin-api/main.go` - Added auth.Init(), /auth/login route, protected route group with jwtauth middleware
- `backend/Dockerfile` - Added seed-build stage; admin-api runtime installs ffmpeg, yt-dlp, copies both binaries
- `docker-compose.yml` - admin-api: HLS volume mount, HLS_ROOT, JWT_SECRET; admin-app: ADMIN_API_INTERNAL_URL
- `.env.example` - Added JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD entries
- `backend/go.mod` / `backend/go.sum` - Added jwtauth/v5 and transitive dependencies

## Decisions Made
- Seed binary copied into admin-api image (not a separate service) — run with `docker compose exec admin-api /bin/seed`
- auth.Init() is explicit function call from main() rather than package-level init() for testability
- Login handler returns identical 401 for both user-not-found and wrong-password to prevent credential enumeration
- JWT uses HS256 symmetric signing — appropriate for single-service admin API

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing go.sum entry after jwtauth upgrade**
- **Found during:** Task 2 (go build ./... after adding auth package)
- **Issue:** go.sum missing entry for golang.org/x/text (transitive via xdg-go/stringprep) after jwtauth brought in newer x/crypto
- **Fix:** Ran `go get github.com/xdg-go/stringprep@v1.0.4` to regenerate go.sum entries
- **Files modified:** backend/go.sum
- **Verification:** `go build ./...` succeeded after fix
- **Committed in:** b205d8a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency issue)
**Impact on plan:** Necessary to unblock compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed go.sum issue above.

## User Setup Required
**Admin user seeding requires manual step after first deploy:**
1. Copy `.env.example` to `.env` and set `JWT_SECRET` to a random 256-bit secret
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
3. Run `docker compose exec admin-api /bin/seed` to create the admin user

## Next Phase Readiness
- JWT auth foundation complete — all subsequent admin-api routes can use the protected route group
- Seed binary ready for initial admin user creation
- yt-dlp and ffmpeg available in admin-api container for Phase 2 Plans 02-04 (video processing)
- HLS volume mounted read-write on admin-api; nginx already mounts it read-only (from Phase 1)

---
*Phase: 02-admin-content-pipeline*
*Completed: 2026-03-01*
