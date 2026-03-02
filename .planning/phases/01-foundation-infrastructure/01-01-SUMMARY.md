---
phase: 01-foundation-infrastructure
plan: 01
subsystem: infra
tags: [docker, docker-compose, nginx, hls, mongo, reverse-proxy]

# Dependency graph
requires: []
provides:
  - Docker Compose orchestration with all 6 services (mongo, site-api, admin-api, site-app, admin-app, nginx)
  - nginx reverse-proxy routing /api/site/, /api/admin/, /admin/, / with prefix stripping
  - HLS static file serving on /hls/ with correct MIME types and CORS headers
  - Dev override file with volume mounts and hot-reload flags for all app services
  - Environment variable template documenting all required secrets
affects:
  - 01-02
  - 01-03
  - 01-04
  - 02-01
  - 02-02
  - 03-01
  - 03-02

# Tech tracking
tech-stack:
  added:
    - docker compose v2
    - nginx:1.25-alpine
    - mongo:7
  patterns:
    - Docker Compose with prod/dev split via override file
    - nginx alias directive for HLS path mapping (not root)
    - Upstream blocks for each backend service
    - Health checks on all services with appropriate start_period values

key-files:
  created:
    - docker-compose.yml
    - docker-compose.override.yml
    - nginx/nginx.conf
    - nginx/Dockerfile
    - .env.example
    - .gitignore
    - .dockerignore
    - data/hls/.gitkeep
  modified: []

key-decisions:
  - "nginx uses alias (not root) for /hls/ location so /hls/{id}/master.m3u8 maps to /var/www/hls/{id}/master.m3u8 matching HLS path convention"
  - "CORS headers on /hls/ allow any origin (*) to support Video.js cross-origin playback in dev and prod"
  - "WebSocket upgrade headers on site-app and admin-app proxy blocks enable Next.js HMR in dev"
  - "site-api and admin-api use expose (not ports) — only accessible through nginx, not directly from host"
  - "dev override exposes mongo port 27017 to host for local tooling access"

patterns-established:
  - "HLS path convention: /hls/{episode_id}/master.m3u8 maps to ./data/hls/{episode_id}/master.m3u8 via bind mount"
  - "API prefix stripping: /api/site/ -> site-api:8081/, /api/admin/ -> admin-api:8082/ (trailing slash on proxy_pass strips prefix)"
  - "All services have healthcheck configuration — nginx depends on service_healthy for all 4 app services"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 1 Plan 01: Docker Compose and nginx Infrastructure Summary

**Docker Compose orchestration for 6 services with nginx reverse-proxy, HLS static file serving with correct MIME types and CORS headers, and dev override with hot-reload volume mounts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T20:59:27Z
- **Completed:** 2026-02-28T21:01:30Z
- **Tasks:** 2 of 2
- **Files modified:** 8

## Accomplishments
- docker-compose.yml defines all 6 services with healthchecks and proper dependency ordering
- nginx reverse-proxies to 4 upstream services with API prefix stripping and WebSocket upgrade support
- /hls/ location serves HLS files with application/vnd.apple.mpegurl and video/mp2t MIME types plus CORS headers
- docker-compose.override.yml adds bind mounts and hot-reload env vars for dev workflow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Docker Compose service definitions and environment template** - `1493325` (chore)
2. **Task 2: Create nginx reverse-proxy configuration with HLS serving** - `96e8a94` (feat)

**Plan metadata:** `0a487c1` (docs: complete plan)

## Files Created/Modified
- `docker-compose.yml` - All 6 services with healthchecks, named volume, and nginx bind mounts
- `docker-compose.override.yml` - Dev overrides: volume mounts for all app services, mongo host port, hot-reload env
- `nginx/nginx.conf` - Reverse proxy with upstreams, /hls/ HLS serving, /healthz endpoint
- `nginx/Dockerfile` - FROM nginx:1.25-alpine, copies nginx.conf, exposes port 80
- `.env.example` - MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD, MONGO_URI
- `.gitignore` - Excludes .env, data/hls/*, build outputs, OS files; keeps data/hls/.gitkeep
- `.dockerignore` - Excludes .git, node_modules, data/, .env from build context
- `data/hls/.gitkeep` - Empty file so git tracks the HLS directory

## Decisions Made
- Used `alias` (not `root`) in nginx /hls/ location so path stripping works correctly for the /hls/{episode_id}/master.m3u8 convention
- CORS wildcard (*) on /hls/ — Video.js requests HLS from the same nginx origin in prod, but wildcard avoids issues when ports differ in dev
- dev override file exposes mongo:27017 to host for local database tooling (e.g., MongoDB Compass)

## Deviations from Plan

None - plan executed exactly as written. One minor issue encountered: Docker daemon (OrbStack) was not running when nginx syntax check was first attempted. OrbStack was started and the check passed on retry. Not a code deviation.

## Issues Encountered
- OrbStack was not running when Task 2 nginx syntax check ran. Started OrbStack via `open -a OrbStack`, waited for daemon, re-ran check. Passed immediately. Not a blocker — nginx.conf was already syntactically correct.

## User Setup Required

None - no external service configuration required. Copy `.env.example` to `.env` (already done locally) before running `docker compose up`.

## Next Phase Readiness
- Docker Compose orchestration complete — Plans 02 (MongoDB), 03 (Go backend), and 04 (Next.js) can all reference these service definitions
- nginx HLS serving ready — video pipeline plans can write to ./data/hls/ and files will be served immediately
- dev override file ready for volume mounts once backend and frontend code is written

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-03-01*
## Self-Check

### Files
- FOUND: docker-compose.yml
- FOUND: docker-compose.override.yml
- FOUND: nginx/nginx.conf
- FOUND: nginx/Dockerfile
- FOUND: .env.example
- FOUND: .gitignore
- FOUND: .dockerignore
- FOUND: data/hls/.gitkeep

### Commits
0a487c1 docs(01-01): complete docker compose and nginx infrastructure plan
96e8a94 feat(01-01): create nginx reverse-proxy configuration with HLS serving
1493325 chore(01-01): create docker compose service definitions and environment template

## Self-Check: PASSED
