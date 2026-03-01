---
phase: 04-user-accounts-and-personalization
plan: 01
subsystem: auth
tags: [jwt, bcrypt, jose, mongodb, nextjs, go, chi, httponly-cookie]

requires:
  - phase: 02-admin-content-pipeline
    provides: auth/jwt.go with Init() and IssueToken() — reused for site users
  - phase: 03-public-browsing-and-playback
    provides: site-api public routes and site-app API helpers — extended with auth layer

provides:
  - POST /auth/register (201/409) and POST /auth/login (200+JWT/401) in site-api
  - Protected /me route group in site-api with jwtauth.Verify + custom site_token cookie finder
  - Subscription and Bookmark data models with compound unique MongoDB indexes
  - createSiteSession/getSiteSession/deleteSiteSession using site_token HttpOnly cookie (7-day maxAge)
  - getCurrentUser() server helper for site-app Server Components (jose jwtVerify, no network round-trip)
  - register/login/logout server actions with Persian error messages and safe return URL redirect
  - Login page (/login) with centered Persian RTL card and ?return= support
  - Register page (/register) with password confirmation client-side validation
  - proxy.ts redirecting guests from /subscriptions /bookmarks /account to /login

affects:
  - 04-02-subscriptions
  - 04-03-bookmarks
  - 04-04-account-profile

tech-stack:
  added:
    - jose (site-app, JWT verification without network round-trip)
  patterns:
    - site-api auth handlers in dedicated site_auth.go and site_me.go files
    - Custom tokenFromSiteCookie inline function (jwtauth.TokenFromCookie reads 'jwt', not configurable)
    - jwtauth.Verify (not Verifier) for custom token finders including cookie extraction
    - useActionState + server actions for Persian RTL login/register forms
    - useSearchParams wrapped in Suspense boundary (Next.js 15 requirement)
    - getCurrentUser() reads JWT from cookie and verifies locally — avoids GET /me network call for auth state

key-files:
  created:
    - backend/internal/handler/site_auth.go
    - backend/internal/handler/site_me.go
    - backend/internal/models/subscription.go
    - backend/internal/models/bookmark.go
    - site-app/src/lib/session.ts
    - site-app/src/lib/auth.ts
    - site-app/src/app/actions/auth.ts
    - site-app/src/app/login/page.tsx
    - site-app/src/app/register/page.tsx
    - site-app/src/proxy.ts
  modified:
    - docker-compose.yml
    - backend/internal/db/mongo.go
    - backend/cmd/site-api/main.go
    - site-app/src/lib/api.ts
    - site-app/package.json

key-decisions:
  - "jwtauth.TokenFromCookie reads hardcoded 'jwt' cookie — used inline tokenFromSiteCookie func instead of jwtauth.TokenFromCookie(\"site_token\")"
  - "jwtauth.Verify (not jwtauth.Verifier) required for passing custom token finder functions including cookie extraction"
  - "getCurrentUser() uses jose jwtVerify locally — avoids GET /me round-trip for basic auth state; GET /me still available for full profile data"
  - "SiteLogin filters role='user' — prevents admin credentials from working on site login endpoint"
  - "Identical 401 message for user-not-found and wrong-password — prevents credential enumeration"
  - "Registration returns generic 409 message ('registration failed') — does not reveal email-already-exists"

patterns-established:
  - "Site auth handlers in site_auth.go and site_me.go — separate from admin handler/auth.go"
  - "Cookie name site_token (not admin_token) — distinct namespace prevents session collision"
  - "proxy.ts (not middleware.ts) — Next.js 16 convention, matches admin-app pattern"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

duration: 3min
completed: 2026-03-01
---

# Phase 4 Plan 1: User Auth Foundation Summary

**Go site-api register/login endpoints with bcrypt + JWT, site_token HttpOnly cookie session, Persian login/register pages, and getCurrentUser() server helper for all subsequent personalization plans**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T11:40:48Z
- **Completed:** 2026-03-01T11:44:25Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- site-api has POST /auth/register (201/409) and POST /auth/login (200+JWT/401) with bcrypt password hashing and identical 401s for user-not-found and wrong-password
- Protected /me/* route group with jwtauth.Verify + custom site_token cookie finder; GET /me returns user profile, PUT /me/password changes password
- Subscription and Bookmark Go models created with compound unique MongoDB indexes ready for Plan 02 and 03
- site-app session management via site_token HttpOnly cookie with 7-day maxAge; getCurrentUser() verifies JWT locally without network call
- Persian RTL login and register pages with centered card layout; login supports ?return= with open-redirect prevention; register has client-side password confirmation

## Task Commits

1. **Task 1: site-api auth handlers, models, indexes, protected routes** - `8c7167b` (feat)
2. **Task 2: site-app session, auth actions, login/register pages, proxy** - `442f418` (feat)

## Files Created/Modified

- `backend/internal/handler/site_auth.go` - SiteRegister (201/409) and SiteLogin (200+JWT/401) handlers
- `backend/internal/handler/site_me.go` - GetMe (projection excludes password_hash) and ChangePassword handlers
- `backend/internal/models/subscription.go` - Subscription struct with UserID, ChannelID, CreatedAt
- `backend/internal/models/bookmark.go` - Bookmark struct with UserID, EpisodeID, CreatedAt
- `backend/internal/db/mongo.go` - CollSubscriptions, CollBookmarks constants + compound unique indexes
- `backend/cmd/site-api/main.go` - auth.Init(), public /auth/* routes, protected /me/* group with tokenFromSiteCookie
- `docker-compose.yml` - JWT_SECRET env var added to site-api and site-app services
- `site-app/src/lib/session.ts` - createSiteSession/getSiteSession/deleteSiteSession (site_token HttpOnly cookie)
- `site-app/src/lib/auth.ts` - getCurrentUser() using jose jwtVerify, returns SiteUser or null
- `site-app/src/lib/api.ts` - apiServerAuthFetch (Bearer token) and authFetch (credentials:include) added
- `site-app/src/app/actions/auth.ts` - register (auto-login after success), login (safe return URL), logout server actions
- `site-app/src/app/login/page.tsx` - Persian RTL centered card, useSearchParams in Suspense, return URL hidden input
- `site-app/src/app/register/page.tsx` - Persian RTL card, client-side password confirmation with useState
- `site-app/src/proxy.ts` - Redirects guests from /subscriptions /bookmarks /account to /login; redirects authed users away from /login /register
- `site-app/package.json` - jose dependency added

## Decisions Made

- **jwtauth.TokenFromCookie reads hardcoded 'jwt' cookie**: The library's `TokenFromCookie` function cannot be parameterized — used an inline `tokenFromSiteCookie` closure instead that reads the `site_token` cookie specifically.
- **jwtauth.Verify vs jwtauth.Verifier**: Used `Verify` (not `Verifier`) — `Verify` accepts variadic token finder functions, `Verifier` does not.
- **getCurrentUser() uses local jose verification**: Avoids a network round-trip to GET /me for auth state checks in Server Components.
- **role filter in SiteLogin**: `{email, role: "user"}` filter prevents admin credentials from authenticating on the site login endpoint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jwtauth.TokenFromCookie is not parameterizable**
- **Found during:** Task 1 (site-api main.go protected route group)
- **Issue:** Plan specified `jwtauth.TokenFromCookie("site_token")` but the library's `TokenFromCookie` is a `func(r *http.Request) string` that hardcodes the `jwt` cookie name — it does not accept a cookie name parameter.
- **Fix:** Defined an inline `tokenFromSiteCookie` function in main.go that reads `r.Cookie("site_token")` and passed it to `jwtauth.Verify`.
- **Files modified:** `backend/cmd/site-api/main.go`
- **Verification:** `go vet ./...` passes with PASS.
- **Committed in:** `8c7167b` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix achieves identical runtime behavior as the plan intended. Cookie auth works correctly. No scope creep.

## Issues Encountered

None — only the TokenFromCookie API deviation which was immediately auto-fixed.

## User Setup Required

None — no new external services. JWT_SECRET env var must already exist in the .env file for the admin-api (from Phase 2). The same JWT_SECRET is now forwarded to site-api and site-app in docker-compose.yml.

## Next Phase Readiness

- Plan 02 (Subscriptions) can build directly on: CollSubscriptions + compound index, SiteUser from getCurrentUser(), apiServerAuthFetch for server-side calls, authFetch for client-side mutations
- Plan 03 (Bookmarks) can build directly on: CollBookmarks + compound index, same auth infrastructure
- Plan 04 (Account/Profile) can build directly on: GET /me, PUT /me/password, getCurrentUser(), logout server action
- All existing public content (homepage, channels, episodes, video player) remains fully accessible without login (AUTH-04 preserved)

---
*Phase: 04-user-accounts-and-personalization*
*Completed: 2026-03-01*
