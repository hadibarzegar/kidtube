---
phase: 02-admin-content-pipeline
plan: "05"
subsystem: ui
tags: [nextjs, react, tailwind, server-actions, polling, youtube-metadata]

requires:
  - phase: 02-admin-content-pipeline
    provides: "Admin REST API endpoints for channels, episodes, jobs, categories, age groups, and YouTube metadata proxy"
  - phase: 02-admin-content-pipeline
    provides: "Admin dashboard shell — login, sidebar, DataTable, categories, age groups CRUD pages"

provides:
  - Channels CRUD pages (list + form with category/age-group dropdowns)
  - Episodes CRUD pages (list with job status badges + form with YouTube metadata auto-fetch on blur)
  - Jobs page with 5s polling, status filter dropdown, expandable failed-job error rows, retry button
  - StatusBadge component with color-coded pill badges for job statuses

affects: [03-viewer-frontend, 05-integration-testing]

tech-stack:
  added: []
  patterns:
    - Client component with useEffect + setInterval for polling, clearInterval cleanup on unmount
    - apiFetch (client-side) vs apiServerFetch (server-side) split: polling uses apiFetch with credentials include
    - Server action retryJob called from client component via direct invocation (not form action)
    - Failed row expansion using Set<string> state for expandedJobIds
    - Adaptive polling frequency — 5s for active statuses, 30s for terminal-only filters
    - YouTube metadata auto-fetch on input blur, pre-fills title/description before form submit

key-files:
  created:
    - admin-app/src/app/channels/page.tsx
    - admin-app/src/app/channels/[id]/page.tsx
    - admin-app/src/app/episodes/page.tsx
    - admin-app/src/app/episodes/[id]/page.tsx
    - admin-app/src/app/jobs/page.tsx
    - admin-app/src/components/StatusBadge.tsx
    - admin-app/src/app/actions/channels.ts
    - admin-app/src/app/actions/episodes.ts
    - admin-app/src/app/actions/jobs.ts
  modified: []

key-decisions:
  - "Jobs page is a client component ('use client') — polling requires useEffect/setInterval which are client-only"
  - "apiFetch used for client-side polling (sends admin_token cookie via credentials: include); apiServerFetch not appropriate here"
  - "Adaptive polling: terminal-only status filters (ready/failed) reduce to 30s interval to save resources"
  - "Expandable error rows use Set<string> state (expandedJobIds) toggled on failed row click"
  - "Retry immediately re-fetches after server action resolves, collapses error row on success"
  - "Duration computed client-side from started_at/completed_at timestamps (not stored in API)"

patterns-established:
  - "Polling pattern: useEffect runs fetchJobs immediately then sets interval; filter state change restarts both"
  - "Failed row expand/collapse: entire row is clickable, chevron indicator shows state"
  - "Retry flow: disable button during action, re-fetch on success, alert on error"
  - "StatusBadge color map: pending=yellow, downloading=blue, transcoding=purple, ready=green, failed=red"

requirements-completed: [CONT-01, CONT-02, CONT-05, CONT-06, VIDE-01, VIDE-04, VIDE-05]

duration: 10min
completed: "2026-03-01"
---

# Phase 02 Plan 05: Channels, Episodes, and Jobs Admin UI Pages Summary

**Five admin content management pages delivered: channels/episodes CRUD with YouTube metadata auto-fetch, and a real-time jobs monitor with 5s polling, status filter, expandable error rows, and one-click retry**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-01T06:00:00Z
- **Completed:** 2026-03-01T06:10:00Z
- **Tasks:** 2 (Task 3 is a human-verify checkpoint, skipped per orchestrator instructions)
- **Files modified:** 9 created

## Accomplishments

- Channels CRUD pages: list with DataTable showing resolved category/age-group names, form with single-select dropdowns for category and age group assignment
- Episodes CRUD pages: list with job status badges matched via episode_id from jobs, form with YouTube URL field that auto-fetches title/description metadata on blur
- Jobs page with real-time polling (5s active, 30s for terminal-only filters), status filter dropdown, failed rows expandable on click showing full error text, retry button resetting job to pending
- StatusBadge component with Tailwind color pills used across episodes and jobs pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Channels and Episodes CRUD pages with YouTube metadata auto-fetch** - `c109fd7` (feat)
2. **Task 2: Create Jobs page with polling, expandable error rows, and retry** - `fbf65e6` (feat)

## Files Created/Modified

- `admin-app/src/app/channels/page.tsx` - Server component; channels list with DataTable, category/age-group names resolved from separate fetches
- `admin-app/src/app/channels/[id]/page.tsx` - Client component; channel create/edit form with category and age group single-select dropdowns
- `admin-app/src/app/episodes/page.tsx` - Server component; episodes list with job status badges matched by episode_id
- `admin-app/src/app/episodes/[id]/page.tsx` - Client component; episode form with YouTube URL field; on blur fetches /youtube-meta and pre-fills title/description
- `admin-app/src/app/jobs/page.tsx` - Client component; polls every 5s, status filter, failed rows expandable with retry button
- `admin-app/src/components/StatusBadge.tsx` - Shared badge component with color map for all 5 job statuses
- `admin-app/src/app/actions/channels.ts` - Server actions for channel create/update/delete via admin-api
- `admin-app/src/app/actions/episodes.ts` - Server actions for episode create/update/delete via admin-api
- `admin-app/src/app/actions/jobs.ts` - Server action retryJob: PATCH /jobs/{id}/retry with Bearer token

## Decisions Made

- Jobs page must be a client component — setInterval/useEffect require browser runtime; no server component equivalent
- apiFetch (client-side, cookie-based) used for polling; apiServerFetch not appropriate for client-side code
- Adaptive polling frequency: 5s when filter includes active statuses, drops to 30s for terminal-only filters (ready/failed)
- Expand state tracked as Set<string> of job IDs — clean toggle without booleans per row
- Retry button stopPropagation prevents row toggle when clicking the button inside an expanded error row

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — build passed cleanly on first attempt with no errors or warnings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 admin content management pages are complete: categories, age-groups, channels, episodes, jobs
- Admin dashboard is functionally complete; ready for end-to-end integration testing
- Phase 3 (viewer frontend) can proceed: episodes with HLS paths and metadata are manageable via admin
- Remaining risk: Persian VTT RTL cue rendering and MongoDB $text index Persian tokenization (flagged in STATE.md)

---
*Phase: 02-admin-content-pipeline*
*Completed: 2026-03-01*
