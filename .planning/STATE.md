# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Kids can safely watch curated Persian educational videos through an intuitive, age-appropriate interface — no ads, no external links, no distractions.
**Current focus:** Phase 1 — Foundation and Infrastructure

## Current Position

Phase: 1 of 5 (Foundation and Infrastructure)
Plan: 1 of 4 in current phase
Status: In progress
Last activity: 2026-03-01 — Completed Plan 01: Docker Compose and nginx Infrastructure

Progress: [█░░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 2 min
- Total execution time: 2 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-infrastructure | 1 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min)
- Trend: -

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 2 risk**: FFmpeg keyframe alignment is complex — use `-force_key_frames "expr:gte(t,n_forced*6)"` and validate output with ffprobe before proceeding
- **Phase 3 risk**: Persian VTT RTL cue rendering differs across browsers and Video.js versions — needs hands-on testing; low-confidence territory
- **Phase 3 risk**: MongoDB $text index may not tokenize Persian correctly — may need `simple` index or regex fallback; validate during search implementation

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 01-01-PLAN.md (Docker Compose and nginx Infrastructure)
Resume file: None
