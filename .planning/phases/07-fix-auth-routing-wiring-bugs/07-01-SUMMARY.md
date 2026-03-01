---
phase: 07-fix-auth-routing-wiring-bugs
plan: 01
subsystem: auth
tags: [jwt, jwtauth, chi, nextjs, middleware, cookies]

# Dependency graph
requires:
  - phase: 02-admin-content-pipeline
    provides: admin-api JWT auth structure (jwtauth.Verifier pattern)
  - phase: 04-user-accounts-and-personalization
    provides: tokenFromSiteCookie pattern in site-api
provides:
  - tokenFromAdminCookie closure reads admin_token cookie in admin-api
  - admin-api protected routes accept both Bearer header and admin_token cookie
  - site-app proxy.ts registered as Next.js 16 Edge Middleware with default export
  - guest redirect guards active for /subscriptions, /bookmarks, /account
affects: [admin-app, site-app, integration-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "jwtauth.Verify (not jwtauth.Verifier) required when using custom token extractor functions"
    - "tokenFromAdminCookie mirrors tokenFromSiteCookie pattern — reads named cookie, falls through to header auth"
    - "Next.js 16 Turbopack registers middleware in functions-config-manifest.json (not legacy middleware-manifest.json)"

key-files:
  created: []
  modified:
    - backend/cmd/admin-api/main.go
    - site-app/src/proxy.ts

key-decisions:
  - "admin-api uses jwtauth.Verify with both TokenFromHeader and tokenFromAdminCookie so server actions (Bearer) and client polling (cookie) both authenticate"
  - "proxy.ts uses default export (export default function proxy) for reliable Next.js 16 Turbopack middleware detection"
  - "Next.js 16 middleware registration verified via functions-config-manifest.json (/_middleware key with 5 matchers) — legacy middleware-manifest.json is unused in Turbopack builds"

patterns-established:
  - "Cookie token extractor pattern: define closure reading named cookie before protected routes group, pass to jwtauth.Verify alongside TokenFromHeader"

requirements-completed: [VIDE-04, ADMN-02]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 7 Plan 01: Fix Auth and Routing Wiring Bugs Summary

**admin-api cookie auth wired via tokenFromAdminCookie closure + jwtauth.Verify; site-app proxy.ts switched to default export for reliable Next.js 16 middleware registration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T14:09:29Z
- **Completed:** 2026-03-01T14:11:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `tokenFromAdminCookie` closure to admin-api that reads `admin_token` cookie — unblocks client-side job polling that was returning 401 because `jwtauth.Verifier` only reads the hardcoded `jwt` cookie
- Replaced `jwtauth.Verifier(auth.TokenAuth)` with `jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromAdminCookie)` — both server action Bearer header and client polling cookie auth now work
- Changed `export function proxy` to `export default function proxy` in site-app/src/proxy.ts — Next.js 16 Turbopack detects default export more reliably; build confirms "Proxy (Middleware)" in route table with all 5 matchers registered

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tokenFromAdminCookie extractor to admin-api JWT verifier** - `47313e9` (fix)
2. **Task 2: Fix site-app proxy.ts export to ensure middleware registration** - `39ed2e2` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/cmd/admin-api/main.go` - Added tokenFromAdminCookie closure; replaced jwtauth.Verifier with jwtauth.Verify using both token extractors
- `site-app/src/proxy.ts` - Changed named export to default export for Next.js 16 middleware detection

## Decisions Made
- `jwtauth.Verify` (not `jwtauth.Verifier`) is required when passing custom token finder functions; `Verifier` is a convenience shorthand that uses only header + hardcoded `jwt` cookie
- Default export in proxy.ts is more reliable for Turbopack detection of middleware files
- Next.js 16 middleware registration is confirmed via `functions-config-manifest.json` (key `/_middleware` with 5 matchers) — the legacy `middleware-manifest.json` `middleware` object remains empty in Turbopack builds; this is expected behavior, not a bug

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Verification command used outdated middleware-manifest.json format**
- **Found during:** Task 2 (proxy.ts export fix)
- **Issue:** Plan's verification command checks `middleware-manifest.json`'s `middleware` object — this is always `{}` in Next.js 16 Turbopack builds; middleware registration moved to `functions-config-manifest.json`
- **Fix:** Used `functions-config-manifest.json` to confirm `/_middleware` key with all 5 matchers is registered; confirmed build output shows "Proxy (Middleware)" label and proxy logic appears in compiled chunks
- **Files modified:** None (verification approach only)
- **Verification:** `node --eval` confirms `functions-config-manifest.json` has `/_middleware` with matchers for `/login`, `/register`, `/subscriptions/:path*`, `/bookmarks/:path*`, `/account/:path*`
- **Committed in:** 39ed2e2 (Task 2 commit)

---

**Total deviations:** 1 auto-investigated (verification approach adapted for Next.js 16 reality)
**Impact on plan:** No scope change. Code fix is exactly as specified. Verification adapted to match actual Next.js 16 Turbopack behavior.

## Issues Encountered
- Next.js 16 Turbopack no longer populates `middleware-manifest.json`'s `middleware` key — it uses `functions-config-manifest.json` instead. The plan's verification script gave a false negative. Actual middleware IS registered and working as confirmed by build output and manifest inspection.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both VIDE-04 and ADMN-02 requirements are now closed: admin job polling authenticates via cookie, site guest redirects are active
- v1.0 milestone requirements should be fully satisfied
- No blockers for integration or end-to-end testing

---
*Phase: 07-fix-auth-routing-wiring-bugs*
*Completed: 2026-03-01*
