# Phase 2: Admin Content Pipeline - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can create and manage channels, episodes, categories, and age groups through a dashboard UI, and can ingest video content via YouTube URL with async HLS transcoding — all visible via job status tracking. Admin authentication (JWT) protects all endpoints.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout & navigation
- Sidebar + content area layout (fixed left sidebar with nav links, main content on right)
- Sidebar nav items: Channels, Episodes, Categories, Age Groups, Jobs
- Data tables with sortable columns and search bar for all content lists
- Dedicated full-page forms for create/edit (navigate to form page, back button returns to list)
- Admin panel UI in English with LTR layout

### Video ingestion UX
- YouTube URL is a field on the episode create/edit form — one action creates the episode and triggers ingestion
- After submitting an episode with a YouTube URL, redirect back to the episodes list with job status shown as a badge/icon in the table row
- Auto-fetch YouTube metadata (title, description, thumbnail URL, duration) after pasting a URL — pre-fill form fields, admin can edit before saving
- Dedicated "Jobs" page in the sidebar nav showing all ingestion jobs (active, completed, failed) in a filterable table

### Content relationships
- Each channel belongs to exactly one category and exactly one age group
- Episodes within a channel have a manual sort order (sort number field) for controlling sequence
- Age groups are admin-managed with full CRUD (not fixed/predefined)
- Channel artwork via image URL field (no file upload in this phase)

### Job status & error handling
- Job status updates via polling (every ~5 seconds) from the admin panel
- Status displayed as colored badges: yellow (pending), blue (downloading), purple (transcoding), green (ready), red (failed)
- Failed jobs show an expandable row in the jobs table revealing error message and a retry button
- Retry re-queues from the failed step (if download succeeded, only retry transcoding; if download failed, retry from download)

### Claude's Discretion
- Exact table column choices and widths
- Form field validation rules and error messages
- Polling interval tuning
- Sidebar visual design and active state indicators
- Episode form field layout and ordering
- JWT token expiry duration and refresh strategy

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-admin-content-pipeline*
*Context gathered: 2026-03-01*
