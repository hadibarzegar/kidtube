# Phase 1: Foundation and Infrastructure - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

All six services (mongo, site-api, admin-api, site-app, admin-app, nginx) boot via Docker Compose and connect. The Go project structure exists with two binaries sharing internal packages. MongoDB is initialized with all collections and indexes. nginx reverse-proxies to all services and serves HLS from a shared volume. RTL layout with Vazirmatn font is configured in both site-app and admin-app root layouts.

</domain>

<decisions>
## Implementation Decisions

### Docker dev workflow
- Full Docker with overrides: `docker-compose.yml` for CI/prod, `docker-compose.override.yml` adds volume mounts, dev flags, and hot-reload
- HLS video files stored via bind mount to `./data/hls` (easy to inspect from host)
- MongoDB data persisted with a named volume, plus a seed script to reset to known state
- All services in a single Docker Compose file with health checks

### MongoDB document design
- Episodes in their own collection with `channel_id` reference (not embedded in channel documents)
- Age groups are admin-defined — stored as documents with custom ranges, not hardcoded enums
- HLS paths derived by convention: `/hls/{episode_id}/master.m3u8` — no explicit path field on episode documents
- Five collections: channels, episodes, categories, age_groups (admin-defined), users, jobs — with appropriate indexes

### RTL and typography
- Vazirmatn font loaded via next/font with weights 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
- Site-app root layout: `<html dir="rtl" lang="fa">` with Vazirmatn as primary font family
- Admin-app also in Persian RTL (same font and direction setup as site-app)
- Phase 1 builds root layout + basic app shell (header placeholder, main content area, container widths) — full page layouts come in Phase 3
- Tailwind CSS for both Next.js apps, using logical properties for RTL support

### Go backend structure
- Go code lives in `./backend/` subfolder (not project root)
- `go.mod` inside `./backend/`
- Two binaries: `backend/cmd/site-api/` and `backend/cmd/admin-api/`
- Shared code in `backend/internal/`
- Chi router for HTTP routing and middleware

### Claude's Discretion
- Port assignments and nginx upstream routing scheme
- Go module path naming
- internal/ package organization (by domain vs by layer)
- MongoDB relationship strategy for categories and age groups on channels (optimized for read-heavy public queries)
- Docker base images and build stages
- Seed script format and initial data

</decisions>

<specifics>
## Specific Ideas

- HLS path convention: `/hls/{episode_id}/master.m3u8` — episode ID is the directory name under the HLS root
- Admin-defined age groups means the `age_groups` collection stores `{name, min_age, max_age}` — initial seed can include "2-5" and "6-10" but admin can add more
- Override file pattern: dev overrides mount source code as volumes and enable file watchers for hot-reload

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-infrastructure*
*Context gathered: 2026-03-01*
