---
phase: 02-admin-content-pipeline
plan: "04"
subsystem: ui
tags: [next.js, tailwind, react, jwt, cookies, server-actions, crud]

# Dependency graph
requires:
  - phase: 02-admin-content-pipeline
    provides: "Admin REST API endpoints for categories, age groups, and auth (plans 01-02)"

provides:
  - "Admin login page with cookie-based JWT session (jose)"
  - "Next.js proxy (route protection) redirecting unauthenticated users to login"
  - "Fixed left sidebar with 5 nav links and active state highlighting"
  - "Reusable DataTable component with search and sortable columns"
  - "Full CRUD UI for categories (list + form pages)"
  - "Full CRUD UI for age groups (list + form pages, min/max age validation)"
  - "Server actions for all mutations with Authorization: Bearer token forwarding"

affects:
  - 02-05-channels-episodes-jobs-ui
  - 03-site-api
  - 04-site-app

# Tech tracking
tech-stack:
  added:
    - "jose (JWT cookie-based sessions)"
  patterns:
    - "Next.js 16 proxy file (src/proxy.ts) replaces middleware.ts for route protection"
    - "LayoutShell client component conditionally renders Sidebar based on pathname"
    - "Server components fetch from ADMIN_API_INTERNAL_URL with Authorization: Bearer header"
    - "Client form components use useActionState(serverAction, undefined) from React 19"
    - "Server actions forward JWT token from cookies() to admin-api via Authorization header"

key-files:
  created:
    - "admin-app/src/lib/session.ts"
    - "admin-app/src/lib/api.ts"
    - "admin-app/src/proxy.ts"
    - "admin-app/src/app/actions/auth.ts"
    - "admin-app/src/app/actions/categories.ts"
    - "admin-app/src/app/actions/age-groups.ts"
    - "admin-app/src/app/login/page.tsx"
    - "admin-app/src/components/Sidebar.tsx"
    - "admin-app/src/components/DataTable.tsx"
    - "admin-app/src/components/LayoutShell.tsx"
    - "admin-app/src/app/categories/page.tsx"
    - "admin-app/src/app/categories/[id]/page.tsx"
    - "admin-app/src/app/categories/[id]/CategoryForm.tsx"
    - "admin-app/src/app/age-groups/page.tsx"
    - "admin-app/src/app/age-groups/[id]/page.tsx"
    - "admin-app/src/app/age-groups/[id]/AgeGroupForm.tsx"
  modified:
    - "admin-app/src/app/layout.tsx"
    - "admin-app/src/app/page.tsx"
    - "admin-app/next.config.ts"
    - "admin-app/package.json"

key-decisions:
  - "Next.js 16 renamed middleware.ts to proxy.ts and requires export named 'proxy' — updated to use new convention"
  - "LayoutShell client component checks pathname to conditionally render Sidebar (not shown on /login)"
  - "Cookie path set to '/' not '/admin' so admin_token cookie is sent to /api/admin/* nginx proxy paths"
  - "Server-to-server calls use Authorization: Bearer header (not cookies) since browser cookies are not sent in server actions"
  - "CategoryForm and AgeGroupForm are separate client components per page directory to keep server pages clean"

patterns-established:
  - "CrudForm pattern: client form component + useActionState + server action with bound id for update"
  - "ServerPage + ClientForm split: server page fetches data and passes as props, client form handles form state"
  - "All server-side data fetching reads admin_token from cookies() and adds Authorization: Bearer header"

requirements-completed: [CONT-03, CONT-04, CONT-06, ADMN-01]

# Metrics
duration: 6min
completed: 2026-03-01
---

# Phase 2 Plan 04: Admin Dashboard UI Shell Summary

**Next.js 16 admin panel with cookie JWT auth, sidebar navigation, reusable DataTable, and full CRUD UI for categories and age groups**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-01T05:51:46Z
- **Completed:** 2026-03-01T05:57:46Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments

- Admin login form with server action calling admin-api, storing JWT in httpOnly cookie
- Route protection via Next.js 16 proxy (renamed from middleware) — unauthenticated users redirect to /admin/login
- Fixed left sidebar (slate-800) with 5 nav links, active state via usePathname, and sign out button
- Reusable DataTable component with client-side search filtering and sortable column headers
- Full CRUD pages for categories: list with DataTable + dedicated form pages (create/edit)
- Full CRUD pages for age groups: list with Name/Min Age/Max Age/Created At columns + form with min/max validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Session management, API helpers, proxy, and login page** - `d3f0b36` (feat)
2. **Task 2: Layout with sidebar and LTR admin shell** - `ebadb52` (feat)
3. **Task 3: Categories and age groups CRUD pages** - `63fb239` (feat)

## Files Created/Modified

- `admin-app/src/lib/session.ts` - createSession/getSession/deleteSession using Next.js cookies()
- `admin-app/src/lib/api.ts` - apiFetch (client/nginx) and apiServerFetch (Docker internal DNS)
- `admin-app/src/proxy.ts` - Route protection proxy (Next.js 16 convention), checks admin_token cookie
- `admin-app/src/app/actions/auth.ts` - login/logout server actions
- `admin-app/src/app/actions/categories.ts` - createCategory/updateCategory/deleteCategory server actions
- `admin-app/src/app/actions/age-groups.ts` - createAgeGroup/updateAgeGroup/deleteAgeGroup server actions
- `admin-app/src/app/login/page.tsx` - Centered login form using useActionState
- `admin-app/src/components/Sidebar.tsx` - Fixed left sidebar with nav links and active state
- `admin-app/src/components/DataTable.tsx` - Reusable table with search, sort, edit/delete actions
- `admin-app/src/components/LayoutShell.tsx` - Client wrapper to conditionally show sidebar
- `admin-app/src/app/categories/page.tsx` - Server component list page with DataTable
- `admin-app/src/app/categories/[id]/page.tsx` - Server page for create/edit category
- `admin-app/src/app/categories/[id]/CategoryForm.tsx` - Client form component
- `admin-app/src/app/age-groups/page.tsx` - Server component list page with DataTable
- `admin-app/src/app/age-groups/[id]/page.tsx` - Server page for create/edit age group
- `admin-app/src/app/age-groups/[id]/AgeGroupForm.tsx` - Client form with min/max validation
- `admin-app/src/app/layout.tsx` - Updated to LTR/English with LayoutShell
- `admin-app/src/app/page.tsx` - Redirects to /admin/channels
- `admin-app/next.config.ts` - Added ADMIN_API_INTERNAL_URL env config

## Decisions Made

- **Next.js 16 proxy convention:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` with a `proxy` named export. Created `src/proxy.ts` with `export function proxy()` instead of `export function middleware()`.
- **LayoutShell pattern:** Used a `LayoutShell` client component to conditionally render the sidebar based on pathname (hidden on /login page), avoiding route group complexity.
- **Cookie path = '/':** The admin_token cookie path must be `/` (not `/admin`) so it is sent to `/api/admin/*` nginx proxy paths as well as admin pages.
- **Server actions use Authorization header:** Browser cookies are not sent in server-to-server calls, so server actions read the JWT from `cookies()` and forward it as `Authorization: Bearer {token}` to admin-api.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed middleware.ts to proxy.ts for Next.js 16 compatibility**
- **Found during:** Task 1 (build verification)
- **Issue:** Next.js 16 deprecated the `middleware` file convention and function name. Build warned about this and required migration to `proxy.ts` with `export function proxy()`.
- **Fix:** Renamed file to `src/proxy.ts` and renamed exported function from `middleware` to `proxy`.
- **Files modified:** `admin-app/src/proxy.ts` (was `middleware.ts`)
- **Verification:** Build passed without warnings
- **Committed in:** `d3f0b36` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - framework API change)
**Impact on plan:** Required fix for correct Next.js 16 behavior. No scope creep.

## Issues Encountered

- Next.js 16 renamed middleware to proxy — discovered during Task 1 build. Fixed automatically per deviation Rule 1 (auto-fix bugs).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin UI shell complete: auth flow, sidebar, DataTable, categories CRUD, age groups CRUD
- Plan 05 can now implement channels, episodes, and jobs pages using the same DataTable + server-action pattern established here
- The CRUD pattern is proven: ServerPage fetches data + ClientForm handles form state with useActionState

---
*Phase: 02-admin-content-pipeline*
*Completed: 2026-03-01*
