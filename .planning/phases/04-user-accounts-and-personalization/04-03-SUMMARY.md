---
phase: 04-user-accounts-and-personalization
plan: 03
subsystem: api, ui
tags: [go, chi, mongodb, next.js, react, admin]

# Dependency graph
requires:
  - phase: 02-admin-content-pipeline
    provides: admin-api JWT auth, protected route group, admin-app DataTable and Sidebar patterns

provides:
  - GET /users admin-api endpoint returning all users sorted by created_at desc with password_hash projected out
  - admin-app /admin/users read-only page with DataTable showing email, role, registration date
  - Users link in admin Sidebar navigation

affects: [04-04, future admin user management plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ListUsers follows same dependency-injection pattern as all other admin handlers
    - MongoDB projection used alongside json:"-" struct tag for belt-and-suspenders password_hash exclusion
    - Admin page uses identical Server Component pattern with cookies() + fetch to admin-api

key-files:
  created:
    - backend/internal/handler/admin_users.go
    - admin-app/src/app/users/page.tsx
  modified:
    - backend/cmd/admin-api/main.go
    - admin-app/src/components/Sidebar.tsx

key-decisions:
  - "ListUsers uses MongoDB SetProjection to exclude password_hash even though json:\"-\" already prevents JSON serialization — belt-and-suspenders security"
  - "Users page is read-only with no onDelete or editPath — v1 admin doesn't need CRUD on users"
  - "GET /users registered as flat route (not r.Route) since only one method needed"

patterns-established:
  - "Read-only admin pages omit onDelete and editPath from DataTable — keeps table simple"

requirements-completed: [ADMN-03]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 4 Plan 3: Admin User Management View Summary

**Read-only admin users list — Go ListUsers handler with password_hash MongoDB projection and Next.js DataTable page wired into the admin sidebar**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-01T11:40:46Z
- **Completed:** 2026-03-01T11:42:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Created `backend/internal/handler/admin_users.go` with ListUsers handler that projects out `password_hash` at the MongoDB query level and sorts by `created_at` descending
- Registered `GET /users` inside the protected JWT group in `admin-api/main.go`
- Created read-only `admin-app/src/app/users/page.tsx` Server Component showing email, role, and registration date via DataTable
- Added "Users" navigation link to admin Sidebar

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin-api ListUsers endpoint and admin-app users page with sidebar link** - `8564726` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `backend/internal/handler/admin_users.go` - ListUsers handler: MongoDB find with sort+projection, returns []models.User as JSON
- `backend/cmd/admin-api/main.go` - Added `r.Get("/users", handler.ListUsers(database))` inside protected group
- `admin-app/src/app/users/page.tsx` - Server Component: fetchUsers() via admin_token cookie, DataTable with email/role/registered columns
- `admin-app/src/components/Sidebar.tsx` - Added `{ label: 'Users', href: '/admin/users' }` to navLinks

## Decisions Made
- MongoDB `SetProjection` explicitly excludes `password_hash` even though `json:"-"` on the struct field already prevents JSON serialization. Belt-and-suspenders approach ensures password hashes never leave the database layer.
- Page is read-only (no `onDelete` or `editPath` on DataTable) — v1 admin scope is visibility only, not user management.
- Registered as a flat `r.Get("/users", ...)` rather than `r.Route` since only a single GET method is needed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin can view registered users from the sidebar at /admin/users
- Table shows email, role, and registration date; password hashes are never exposed
- Ready for Phase 4 Plan 4 (watch history or any next plan in the phase)

---
*Phase: 04-user-accounts-and-personalization*
*Completed: 2026-03-01*
