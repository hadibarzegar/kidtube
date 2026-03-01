# Phase 5: Polish and Operations - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

The platform handles direct video file uploads as an alternative to YouTube URL import, nginx cache is tuned for HLS performance, and the system is hardened for production operation (clean restarts, volume persistence). This phase does NOT add new user-facing features beyond the admin upload capability.

</domain>

<decisions>
## Implementation Decisions

### Upload Experience
- Drag-and-drop zone with click-to-browse fallback for file selection
- File size limit of 2GB maximum
- Accept common video formats: MP4, MKV, MOV, AVI, WebM
- Progress bar with percentage, file size, and estimated time remaining during upload

### Admin UI Integration
- Tabbed interface on the episode form: "YouTube URL" tab and "Upload File" tab — clean separation with both visible as options
- Details-first flow: admin fills in episode metadata (title, description, order), then selects/drops the file — upload starts on form submit
- Uploaded videos appear in the same jobs list as YouTube downloads, with a "source" column distinguishing "YouTube" vs "Upload"
- Single file upload per episode (no batch upload)

### Cache & Production Hardening
- Claude's discretion on all operational decisions — apply standard best practices
- Immutable cache-control for .ts segments, no-cache for .m3u8 playlists
- restart: unless-stopped for all Docker services
- Volume persistence verification as part of restart testing

### Claude's Discretion
- Exact drag-and-drop component styling (match existing admin panel aesthetic)
- Upload chunking strategy for large files
- Cache header exact values and CORS tuning
- Docker healthcheck configuration
- Error states and retry behavior for failed uploads
- Temporary file cleanup after successful transcoding

</decisions>

<specifics>
## Specific Ideas

- Upload should feel integrated with the existing episode creation flow, not bolted on
- The admin should see uploaded videos in the same pipeline/jobs view as YouTube imports — unified experience
- Tab-based source selection keeps the UI clean without cluttering the form

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-polish-and-operations*
*Context gathered: 2026-03-01*
