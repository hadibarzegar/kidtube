---
phase: 05-polish-and-operations
plan: 02
subsystem: admin-ui
tags: [nextjs, typescript, file-upload, xhr, drag-and-drop, tailwind]

# Dependency graph
requires:
  - phase: 05-01
    provides: POST /api/admin/episodes/upload multipart endpoint, Job.Source field

provides:
  - Tabbed episode creation form (YouTube URL / Upload File) in admin-app
  - Drag-and-drop file zone with click-to-browse fallback for video file selection
  - XHR-based file upload with real-time progress bar (percentage + ETA)
  - Source column on Jobs page with YouTube (blue) / Upload (purple) colored badges

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - XMLHttpRequest with upload.onprogress for real-time upload progress (fetch API lacks this)
    - withCredentials=true on XHR to send admin_token cookie cross-origin
    - Imperative input[type=file] creation for click-to-browse without hidden form element
    - Conditional colSpan update when adding columns to tables with empty/error span rows

key-files:
  created: []
  modified:
    - admin-app/src/app/episodes/[id]/page.tsx
    - admin-app/src/app/jobs/page.tsx

key-decisions:
  - "XHR over fetch for upload — fetch API has no upload progress event; XHR xhr.upload.onprogress is the only browser API for tracking upload bytes sent"
  - "Tabs only on new episode form (isNew guard) — editing an existing episode has no source change; upload tab irrelevant post-creation"
  - "Text fields appended to FormData before file — Go's MultipartReader reads parts sequentially and expects channel_id/title/etc. before the file binary stream"
  - "Default Source badge to YouTube when job.source is falsy — all pre-existing jobs were YouTube imports before Source field was introduced in 05-01"

patterns-established:
  - "Details-first upload flow: admin fills metadata (channel, title, description), then selects/drops file, upload triggers on form submit"
  - "Drag-and-drop with imperative file input: onDrop handles DataTransfer.files, onClick creates input imperatively — avoids hidden input element in form"

requirements-completed:
  - VIDE-07

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 05 Plan 02: Admin Upload UI Summary

**Tabbed episode creation form with YouTube URL and Upload File source selection, drag-and-drop zone with XHR progress bar, and Source column on Jobs page distinguishing YouTube vs Upload origins**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T12:22:48Z
- **Completed:** 2026-03-01T12:25:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Episode form refactored to show two tabs (YouTube URL / Upload File) when creating a new episode; edit form unchanged
- Upload tab features drag-and-drop zone that accepts MP4, MKV, MOV, AVI, WebM up to 2GB, with click-to-browse fallback
- XHR sends multipart FormData to `/api/admin/episodes/upload` with `withCredentials=true`; progress bar shows percentage and ETA computed from elapsed time
- Successful upload redirects to `/admin/episodes` (same post-submit flow as YouTube path)
- Jobs table extended with Source column; YouTube jobs shown in blue, Upload jobs in purple; legacy jobs (no source field) default to YouTube badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor episode form with YouTube/Upload tabs, drag-and-drop zone, and XHR upload progress** - `0101a5a` (feat)
2. **Task 2: Add Source column to Jobs page** - `cf089fe` (feat)

## Files Created/Modified

- `admin-app/src/app/episodes/[id]/page.tsx` - Added sourceTab/uploadFile/uploadProgress/uploadStartTime/isUploading/isDragOver state; ACCEPTED_VIDEO_TYPES/ACCEPTED_EXTENSIONS/MAX_FILE_SIZE constants; formatFileSize/getEstimatedTimeRemaining helpers; tabbed UI with drag-and-drop zone and XHR upload path in handleSubmit
- `admin-app/src/app/jobs/page.tsx` - Extended Job interface with source field; added Source column header and colored badge cells; updated colSpan from 6 to 7 for empty state and error detail rows

## Decisions Made

- **XHR over fetch for upload progress:** The fetch API provides no upload progress event. `XMLHttpRequest.upload.onprogress` is the only browser API that fires during the upload phase (not just download). XHR was used exclusively for the upload path while the existing YouTube path continues to use server actions.
- **Tabs only on new episode form:** The `isNew` guard already controlled YouTube URL visibility. Upload tab added under the same guard since source selection is irrelevant when editing an existing episode.
- **Text fields before file in FormData:** Go's `MultipartReader` reads parts sequentially. `channel_id`, `title`, etc. must be appended before `file` so the handler can parse metadata before opening the output file path derived from the pre-allocated episodeID.
- **Default Source badge to YouTube for legacy jobs:** All jobs created before Plan 05-01 have no `source` field. Defaulting to YouTube via `job.source === 'upload' ? 'Upload' : 'YouTube'` handles falsy values correctly without migration.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both tasks compiled on the first attempt, build passed cleanly.

## User Setup Required

None - admin UI changes only; no backend configuration required.

## Next Phase Readiness

- Admin can now create episodes from local video files via drag-and-drop or click-to-browse
- Upload progress gives clear feedback during large file uploads
- Jobs page provides unified view of all ingestion jobs with source origin visible at a glance
- Phase 05 complete — v1.0 feature set fully implemented

---
*Phase: 05-polish-and-operations*
*Completed: 2026-03-01*

## Self-Check: PASSED

All files verified present and all task commits confirmed in git history.
