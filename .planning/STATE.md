---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T05:47:37.311Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 9
  completed_plans: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Kids can safely watch curated Persian educational videos through an intuitive, age-appropriate interface — no ads, no external links, no distractions.
**Current focus:** Phase 2 — Admin Content Pipeline

## Current Position

Phase: 2 of 5 (Admin Content Pipeline)
Plan: 3 of 4 in current phase (complete)
Status: In progress
Last activity: 2026-03-01 — Completed Plan 03: Sequential Ingestion Worker (yt-dlp + FFmpeg HLS)

Progress: [████░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 4 min
- Total execution time: 19 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-infrastructure | 4 | 16 min | 4 min |
| 02-admin-content-pipeline | 1 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 01-02 (4 min), 01-03 (5 min), 01-04 (5 min), 02-01 (3 min)
- Trend: stable

*Updated after each plan completion*
| Phase 02-admin-content-pipeline P01 | 3 | 3 tasks | 8 files |
| Phase 02-admin-content-pipeline P03 | 3 | 2 tasks | 2 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 2 risk (resolved)**: FFmpeg keyframe alignment implemented with `-force_key_frames "expr:gte(t,n_forced*6)"` for fps-agnostic alignment; validate output with ffprobe during integration testing
- **Phase 3 risk**: Persian VTT RTL cue rendering differs across browsers and Video.js versions — needs hands-on testing; low-confidence territory
- **Phase 3 risk**: MongoDB $text index may not tokenize Persian correctly — may need `simple` index or regex fallback; validate during search implementation

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 02-03-PLAN.md (Sequential Ingestion Worker)
Resume file: None
