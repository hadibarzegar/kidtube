---
phase: 03-public-browsing-and-playback
plan: 01
subsystem: api
tags: [go, chi, mongodb, bson, nextjs, typescript, site-api, public-api, docker-compose]

# Dependency graph
requires:
  - phase: 01-foundation-infrastructure
    provides: MongoDB models (Channel, Episode, Category, AgeGroup), db.CollConstants, chi router pattern, mongo-driver v2 handler factory pattern
  - phase: 02-admin-content-pipeline
    provides: Episodes with status=ready set by job worker; channels created via admin UI

provides:
  - Public site-api REST endpoints (channels, episodes, categories, age-groups, search) — no auth
  - site-app apiServerFetch (Docker internal DNS) and apiFetch (nginx proxy) helpers
  - SITE_API_INTERNAL_URL env var wired into docker-compose site-app service

affects:
  - 03-02 (channel/episode browsing pages use apiServerFetch from this plan)
  - 03-03 (episode playback page uses apiServerFetch for episode data)
  - 03-04 (search page uses apiFetch for client-side search)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Site handler factory pattern: functions prefixed 'Site' accept *mongo.Database, return http.HandlerFunc — separate from admin handlers with different query logic"
    - "Public API design: status=ready always in episode filters; regex search uses regexp.QuoteMeta for safety"
    - "Parallel search pattern: sync.WaitGroup with two goroutines for channels+episodes concurrency with graceful degradation on error"

key-files:
  created:
    - backend/internal/handler/site_channel.go
    - backend/internal/handler/site_episode.go
    - backend/internal/handler/site_category.go
    - backend/internal/handler/site_age_group.go
    - backend/internal/handler/site_search.go
    - site-app/src/lib/api.ts
  modified:
    - backend/cmd/site-api/main.go
    - docker-compose.yml

key-decisions:
  - "Public site-api handlers are separate files (site_*.go) from admin handlers — different query logic (status filtering, array-contains, regex search)"
  - "Episodes always filtered to status=ready on all public endpoints — pending/failed episodes are invisible to public site"
  - "Search uses bson.Regex with regexp.QuoteMeta — escapes user input safely for MongoDB regex injection prevention"
  - "Search runs channels and episodes queries in parallel goroutines with sync.WaitGroup — graceful degradation logs errors but returns partial results"
  - "apiFetch uses /api/site path (nginx proxy); apiServerFetch uses SITE_API_INTERNAL_URL (Docker internal DNS) — same pattern as admin-app"

patterns-established:
  - "Site fetch helpers: apiServerFetch for Server Components (Docker DNS), apiFetch for Client Components (nginx proxy)"
  - "Public filtering: category_ids and age_group_ids use MongoDB array-contains semantics (single value match)"

requirements-completed: [BROW-02, BROW-03, BROW-04, BROW-05, AUTH-04]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 3 Plan 01: Public Site-API Endpoints and Site-App API Client Summary

**Public REST API for browsing — 7 unauthenticated endpoints with category/age-group filtering, status=ready episode gating, and parallel regex search across channels and episodes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T06:35:15Z
- **Completed:** 2026-03-01T06:37:22Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 5 public handler files created: channels (with category/age-group filters), episodes (status=ready only), categories, age-groups, and parallel search
- 7 public routes registered in site-api main.go with no auth middleware (AUTH-04 compliant)
- site-app API client with apiServerFetch (Docker internal) and apiFetch (nginx /api/site/) helpers
- SITE_API_INTERNAL_URL env var added to docker-compose.yml site-app service

## Task Commits

Each task was committed atomically:

1. **Task 1: Create public site-api handler files** - `3967a77` (feat)
2. **Task 2: Wire routes, add env var, create api.ts** - `0daed37` (feat)

## Files Created/Modified
- `backend/internal/handler/site_channel.go` - SiteListChannels (category_id/age_group_id filters, created_at desc), SiteGetChannel
- `backend/internal/handler/site_episode.go` - SiteListEpisodes (status=ready only, order asc), SiteGetEpisode (status=ready gated)
- `backend/internal/handler/site_category.go` - SiteListCategories sorted by name asc
- `backend/internal/handler/site_age_group.go` - SiteListAgeGroups sorted by min_age asc
- `backend/internal/handler/site_search.go` - SiteSearch with parallel goroutines, case-insensitive regex, episodes filtered to status=ready
- `site-app/src/lib/api.ts` - apiServerFetch (Docker internal) and apiFetch (nginx proxy) helpers
- `backend/cmd/site-api/main.go` - 7 public routes registered after /healthz
- `docker-compose.yml` - SITE_API_INTERNAL_URL env var added to site-app service

## Decisions Made
- Site handlers live in separate site_*.go files (not in existing admin handler files) to keep public and admin query logic isolated
- Episodes always filtered to status=ready on all public endpoints — pending/failed episodes never surface to site visitors
- Search uses regexp.QuoteMeta to safely escape user query input before building MongoDB regex
- Search goroutines use graceful degradation — log errors but return successful partial results rather than 500ing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All public site-api endpoints ready for Next.js Server Components to consume via apiServerFetch
- apiFetch available for client-side search components
- Categories and age-groups endpoints ready for browse filter UI (plan 03-02)
- Episodes endpoint with channel_id filter ready for channel detail pages (plan 03-02)
- Single episode endpoint ready for playback page (plan 03-03)

---
*Phase: 03-public-browsing-and-playback*
*Completed: 2026-03-01*

## Self-Check: PASSED

All created files exist and all task commits verified:
- FOUND: backend/internal/handler/site_channel.go
- FOUND: backend/internal/handler/site_episode.go
- FOUND: backend/internal/handler/site_category.go
- FOUND: backend/internal/handler/site_age_group.go
- FOUND: backend/internal/handler/site_search.go
- FOUND: site-app/src/lib/api.ts
- FOUND: commit 3967a77 (Task 1)
- FOUND: commit 0daed37 (Task 2)
