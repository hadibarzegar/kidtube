---
phase: 05-polish-and-operations
plan: 03
subsystem: infra
tags: [nginx, hls, docker, cache-control, cors]

# Dependency graph
requires:
  - phase: 05-polish-and-operations
    provides: nginx.conf with upload proxy location (05-01), foundational nginx setup (01-01)

provides:
  - nginx map directive mapping $uri to $hls_cache_control for per-extension cache headers
  - .ts segments served with Cache-Control: public, max-age=31536000, immutable
  - .m3u8 playlists served with Cache-Control: no-cache
  - All CORS headers on /hls/ location with always parameter (applies on 206 partial content)
  - Verified all 6 Docker services with restart: unless-stopped and healthcheck blocks

affects:
  - HLS playback performance (repeat views use immutable .ts cache)
  - Video.js CORS on range requests (206 partial content now includes CORS headers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - nginx map directive for per-extension Cache-Control — single location block, no inheritance issues
    - add_header always parameter — sends headers on all response codes including 206 Partial Content

key-files:
  created: []
  modified:
    - nginx/nginx.conf
    - docker-compose.yml

key-decisions:
  - "nginx map directive (not nested locations) for per-extension cache — avoids add_header inheritance trap that silently drops CORS headers"
  - "add_header always on all CORS headers — Video.js sends Range-based HLS requests that get 206 responses; CORS headers must be present on those too"
  - ".ts segments get immutable 1-year cache — content-addressed by design (FFmpeg output is deterministic for a given segment), safe to cache forever"
  - ".m3u8 playlists get no-cache — client must revalidate to get current segment list as episodes progress through transcoding"

patterns-established:
  - "map $uri $variable in http block + add_header $variable always in location block — safe pattern for per-URI header values without nested locations"

requirements-completed:
  - VIDE-07

# Metrics
duration: 1min
completed: 2026-03-01
---

# Phase 05 Plan 03: nginx HLS Cache Tuning and Production Hardening Summary

**nginx map-based per-extension HLS cache headers (.ts immutable 1-year, .m3u8 no-cache) with CORS always parameter for 206 range responses, and verified production restart policies across all 6 Docker services**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T12:22:43Z
- **Completed:** 2026-03-01T12:23:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- nginx map directive added in `http {}` block mapping `$uri` to `$hls_cache_control` variable — .ts segments get `public, max-age=31536000, immutable`, .m3u8 playlists get `no-cache`, fallback is 1 hour
- All CORS headers in `/hls/` location updated with `always` parameter ensuring they appear on 206 Partial Content responses Video.js sends for HLS range-based segment requests
- All 6 Docker services confirmed with `restart: unless-stopped`, `healthcheck` blocks, and correct HLS volume mounts (admin-api rw, nginx ro)
- Production hardening comment block added to docker-compose.yml for documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add map directive for per-extension HLS cache headers in nginx** - `2416078` (feat)
2. **Task 2: Verify production hardening configuration in docker-compose.yml** - `b813aaa` (chore)

## Files Created/Modified
- `nginx/nginx.conf` - Added `map $uri $hls_cache_control` block in http section; updated `/hls/` location to use `$hls_cache_control always` and added `always` to all CORS headers
- `docker-compose.yml` - Added production hardening comment block at top (no functional changes — all policies already present)

## Decisions Made
- **map directive over nested locations:** Plan specified this approach explicitly. Nested `location ~ \.ts$` blocks inside `/hls/` would trigger nginx's `add_header` inheritance rule — child blocks do not inherit parent `add_header` directives, silently dropping all CORS headers. The map approach keeps everything in one block.
- **always on CORS headers:** Video.js sends HTTP Range requests for HLS .ts segments; nginx returns 206 Partial Content. Without `always`, CORS headers only appear on 2xx responses. 206 is not 2xx so CORS headers would be absent, causing cross-origin failures.
- **immutable on .ts segments:** FFmpeg segments are content-addressed — once written, a segment file never changes. 1-year immutable is safe and eliminates all repeat-view segment fetches for returning viewers.
- **no-cache on .m3u8:** Playlists list which segments are current. If cached, clients won't see new segments appended during ongoing transcoding jobs. no-cache forces revalidation on every playlist request.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - nginx syntax check passed on first attempt, all docker-compose verification checks passed without modifications.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HLS serving is fully tuned: repeat playback will use immutable .ts caches eliminating redundant segment downloads
- CORS headers are robust across all HTTP status codes including 206 range responses
- All services will auto-restart after host reboot without manual intervention
- Platform is production-ready from a caching and availability standpoint

---
*Phase: 05-polish-and-operations*
*Completed: 2026-03-01*

## Self-Check: PASSED

- nginx/nginx.conf: verified present with map directive, immutable .ts, no-cache .m3u8, always CORS
- docker-compose.yml: verified present with 6x restart: unless-stopped, 6x healthcheck
- Task 1 commit 2416078: confirmed in git history
- Task 2 commit b813aaa: confirmed in git history
