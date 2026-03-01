---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T10:10:27.150Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 13
  completed_plans: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Kids can safely watch curated Persian educational videos through an intuitive, age-appropriate interface — no ads, no external links, no distractions.
**Current focus:** Phase 3 — Public Browsing and Playback

## Current Position

Phase: 3 of 5 (Public Browsing and Playback)
Plan: 4 of 4 in current phase (complete)
Status: Phase 3 complete — All 4 plans done
Last activity: 2026-03-01 — Completed Plan 03-04: CountdownOverlay + WatchClient autoplay-next, Video.js CSS polish, responsive verification

Progress: [██████████] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 3 min
- Total execution time: 20 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-infrastructure | 4 | 16 min | 4 min |
| 02-admin-content-pipeline | 1 | 3 min | 3 min |
| 03-public-browsing-and-playback | 4 | 7 min | 2 min |

**Recent Trend:**
- Last 5 plans: 02-01 (3 min), 03-01 (2 min), 03-02 (2 min), 03-03 (2 min), 03-04 (1 min)
- Trend: stable

*Updated after each plan completion*
| Phase 02-admin-content-pipeline P01 | 3 | 3 tasks | 8 files |
| Phase 02-admin-content-pipeline P03 | 3 | 2 tasks | 2 files |
| Phase 02 P04 | 6 | 3 tasks | 20 files |
| Phase 02-admin-content-pipeline P05 | 10 | 2 tasks | 9 files |
| Phase 03-public-browsing-and-playback P01 | 2 | 2 tasks | 8 files |
| Phase 03-public-browsing-and-playback P02 | 2 | 2 tasks | 13 files |
| Phase 03-public-browsing-and-playback P03 | 2 | 2 tasks | 7 files |
| Phase 03-public-browsing-and-playback P04 | 1 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-phase]: Video.js 8.23 chosen over Vidstack (unresolved React 19 compatibility issues in Vidstack)
- [Pre-phase]: mongo-driver v2 only — decode into typed Go structs, never raw bson.M maps
- [Pre-phase]: RTL must be wired in Phase 1 — retrofitting is painful and risky
- [Pre-phase]: yt-dlp must run in a sequential queue (never concurrent) to avoid YouTube 429s
- [01-01]: nginx uses alias (not root) for /hls/ location so /hls/{id}/master.m3u8 maps to /var/www/hls/{id}/master.m3u8 matching HLS path convention
- [01-01]: CORS wildcard (*) on /hls/ — Video.js requests HLS from same nginx origin in prod, wildcard avoids dev port mismatch issues
- [01-01]: site-api and admin-api use expose (not ports) — only accessible through nginx, not directly from host
- [01-02]: bson.ObjectID instead of primitive.ObjectID — mongo-driver v2 merged primitive types into bson package (bson/primitive subpackage removed in v2)
- [01-02]: HLS path derived by convention /hls/{episode_id}/master.m3u8 — no explicit path field on Episode documents
- [01-02]: AgeGroup stored as admin-defined documents (not hardcoded enums) — allows custom age ranges at runtime
- [01-04]: Tailwind v4 (installed by create-next-app@latest) uses @theme CSS blocks instead of tailwind.config.ts — font configured via @theme { --font-sans: var(--font-vazirmatn) }
- [01-04]: next/font/local loads Vazirmatn from node_modules — preferred for offline/Docker builds over Google Fonts
- [01-04]: admin-app basePath set to /admin to match nginx routing from Plan 01
- [Phase 01-03]: HealthHandler accepts *mongo.Database not *mongo.Client — handler operates at database level consistent with all other handlers
- [Phase 01-03]: 503 on MongoDB ping failure — health check signals true service health for Docker and load balancers, not just process liveness
- [Phase 01-03]: middleware.RequestID added to both chi routers — required for log correlation in distributed tracing
- [02-01]: seed binary copied into admin-api Docker image (not a separate service) — run via docker compose exec admin-api /bin/seed
- [02-01]: auth.Init() called explicitly from main() (not package-level init) so it can be tested without setting JWT_SECRET globally
- [02-01]: JWT uses HS256 symmetric key — sufficient for single-service admin API
- [02-01]: Login handler returns identical 401 for user-not-found and wrong-password to prevent credential enumeration
- [Phase 02-03]: Use -force_key_frames expr:gte(t,n_forced*6) for fps-agnostic HLS keyframe alignment (YouTube sources vary 24-60fps)
- [Phase 02-03]: Capture yt-dlp/ffmpeg stderr into bytes.Buffer for rich Job.Error messages displayed in admin panel
- [Phase 02-03]: Cancel workerCtx before srv.Shutdown for graceful in-progress job cancellation on restart
- [02-02]: CreateEpisode returns 202 Accepted (not 201) when source_url triggers Job creation to signal async processing
- [02-02]: ListJobs sorts by created_at descending for job queue monitoring
- [02-02]: YouTubeMeta returns 502 Bad Gateway when yt-dlp fails (upstream dependency failure, not internal error)
- [02-02]: AgeGroup validation rejects min_age >= max_age and negative values; zero-width ranges invalid
- [02-02]: RetryJob only permits retry when job.Status == "failed"; returns 400 for all other states
- [Phase 02-04]: Next.js 16 renamed middleware.ts to proxy.ts with export function proxy() — all admin apps must use proxy.ts
- [Phase 02-04]: LayoutShell client component checks pathname to conditionally render Sidebar (hidden on login page)
- [Phase 02-04]: Cookie path='/' not '/admin' — admin_token must reach /api/admin/* nginx proxy paths
- [Phase 02-04]: Server actions forward JWT as Authorization: Bearer header (not cookies) to admin-api for server-to-server calls
- [Phase 02-admin-content-pipeline]: Jobs page is a client component with setInterval polling every 5s; adaptive 30s for terminal-only status filters; apiFetch with credentials for client-side polling
- [Phase 02-admin-content-pipeline]: Expandable failed-job error rows use Set<string> state; retry re-fetches immediately and collapses the error row on success
- [03-01]: Public site-api handlers in separate site_*.go files — different query logic from admin handlers (status filtering, array-contains, regex search)
- [03-01]: Episodes always filtered to status=ready on all public endpoints — pending/failed episodes never surface to site visitors
- [03-01]: Search uses regexp.QuoteMeta + bson.Regex with options "i" — safely escapes user input for MongoDB regex
- [03-01]: Search goroutines use graceful degradation — log errors but return successful partial results rather than 500ing
- [03-01]: site-app uses apiServerFetch (SITE_API_INTERNAL_URL Docker DNS) for Server Components; apiFetch (/api/site nginx proxy) for Client Components
- [03-02]: URL-param approach for age filter (/?age_group_id=xxx) — pure Server Component, bookmarkable, SEO-friendly vs client state
- [03-02]: Suspense boundary wraps AgeFilterTabs — required by Next.js 15 when useSearchParams is used as child of Server Component
- [03-02]: Shared types extracted to lib/types.ts — avoids duplicating Channel/Episode/Category/AgeGroup across ~10 consuming files
- [03-02]: BottomTabBar returns null on /watch/* routes — prevents bottom bar overlapping video player controls
- [03-03]: VideoPlayerWrapper must be 'use client' — next/dynamic ssr:false called from a Server Component throws a runtime error
- [03-03]: dir="ltr" on player wrapper div prevents RTL html dir from mirroring Video.js control bar (PLAY-07)
- [03-03]: dispose() called in separate useEffect cleanup to free media streams on unmount — MUST be in separate effect from initialization
- [Phase 03-04]: WatchClient relative container enables absolute CountdownOverlay overlay — autoplay-next pattern for kid episode sequences
- [Phase 03-04]: nextEpisode computed server-side in page.tsx via order+1 lookup — avoids shipping full episode list to client

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 2 risk (resolved)**: FFmpeg keyframe alignment implemented with `-force_key_frames "expr:gte(t,n_forced*6)"` for fps-agnostic alignment; validate output with ffprobe during integration testing
- **Phase 3 risk**: Persian VTT RTL cue rendering differs across browsers and Video.js versions — needs hands-on testing; low-confidence territory
- **Phase 3 risk**: MongoDB $text index may not tokenize Persian correctly — may need `simple` index or regex fallback; validate during search implementation

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 03-04-PLAN.md (CountdownOverlay autoplay-next, WatchClient, Video.js CSS polish — Phase 3 complete)
Resume file: None
