---
phase: 04-user-accounts-and-personalization
plan: 02
subsystem: personalization
tags: [subscriptions, bookmarks, optimistic-ui, auth-aware-navigation, server-components, mongodb]

requires:
  - phase: 04-user-accounts-and-personalization
    plan: 01
    provides: getCurrentUser, getSiteSession, apiServerAuthFetch, authFetch, CollSubscriptions, CollBookmarks with compound unique indexes

provides:
  - GET /me/subscriptions (returns channel array sorted by created_at desc)
  - POST /me/subscriptions/{channel_id} (201 on success, 409 if duplicate)
  - DELETE /me/subscriptions/{channel_id} (200, idempotent)
  - GET /me/bookmarks (returns ready episodes sorted by created_at desc)
  - POST /me/bookmarks/{episode_id} (201 on success, 409 if duplicate)
  - DELETE /me/bookmarks/{episode_id} (200, idempotent)
  - SubscribeButton client component with optimistic UI and 401 guest redirect
  - BookmarkButton client component with optimistic UI and 401 guest redirect
  - ProfileDropdown client component with avatar circle and dropdown menu
  - Auth-aware TopNavbar showing guest button or avatar dropdown
  - Personalized homepage "My Channels" rail for logged-in users
  - /subscriptions page with subscribed channels grid
  - /bookmarks page with bookmarked episodes grid
  - /account page with email display and ChangePasswordForm

affects:
  - site-app navigation and homepage personalization
  - channel page subscription UX
  - watch page bookmark UX

tech-stack:
  added: []
  patterns:
    - Optimistic UI pattern — state updated immediately, reverted on error or 401
    - 401-to-login redirect — client components redirect guests to /login?return=current_path
    - Server Component initial state — subscription/bookmark state fetched server-side and passed as initialX props to client components
    - N+1 lookup accepted for v1 — GetSubscriptions/GetBookmarks fetch each channel/episode individually; acceptable for small user subscription lists

key-files:
  created:
    - backend/internal/handler/site_me.go (extended with 6 new handlers)
    - site-app/src/components/SubscribeButton.tsx
    - site-app/src/components/BookmarkButton.tsx
    - site-app/src/components/ProfileDropdown.tsx
    - site-app/src/app/subscriptions/page.tsx
    - site-app/src/app/bookmarks/page.tsx
    - site-app/src/app/account/page.tsx
    - site-app/src/app/account/ChangePasswordForm.tsx
  modified:
    - backend/cmd/site-api/main.go (6 new routes in protected group)
    - site-app/src/lib/types.ts (SiteUser interface added)
    - site-app/src/components/TopNavbar.tsx (auth-aware server component)
    - site-app/src/app/page.tsx (My Channels rail for logged-in users)
    - site-app/src/app/channel/[id]/page.tsx (SubscribeButton added)
    - site-app/src/app/watch/[id]/page.tsx (bookmark state passed to WatchClient)
    - site-app/src/app/watch/[id]/WatchClient.tsx (BookmarkButton rendered)

decisions:
  - "ChangePasswordForm is a separate client component file — account/page.tsx stays a pure Server Component that fetches user email; the form handles its own state and authFetch call"
  - "TopNavbar fetches /me via apiServerAuthFetch for email — JWT only contains user_id and role, not email; one API call per request is acceptable for nav"
  - "N+1 lookups in GetSubscriptions/GetBookmarks accepted for v1 — user subscription lists are small in practice; can optimize with $in operator later if needed"
  - "409 treated as success by SubscribeButton/BookmarkButton — concurrent taps or cache-stale state may trigger duplicate inserts; treating 409 as success avoids confusing the user"

requirements-completed: [AUTH-05, AUTH-06]

duration: 5min
completed: 2026-03-01
---

# Phase 4 Plan 2: Subscriptions, Bookmarks, Personalization Summary

**Subscribe/bookmark API endpoints with optimistic UI toggle components, auth-aware TopNavbar with ProfileDropdown, personalized My Channels homepage rail, and dedicated /subscriptions, /bookmarks, /account pages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T11:48:08Z
- **Completed:** 2026-03-01T11:52:45Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- site-api has six new protected endpoints: GET/POST/DELETE /me/subscriptions/{channel_id} and GET/POST/DELETE /me/bookmarks/{episode_id}; all return channels/episodes (not raw subscription/bookmark documents) for frontend simplicity
- SubscribeButton and BookmarkButton use optimistic UI — state updates immediately before API confirms; reverts on error; redirects guests to /login with return URL on 401
- TopNavbar is now an async Server Component that calls getCurrentUser() and renders ProfileDropdown (with avatar+email) for logged-in users or "ورود / ثبت‌نام" link for guests
- Homepage shows a "کانال‌های من" rail at the top for logged-in users with subscriptions, fetched server-side with cache: no-store
- /subscriptions, /bookmarks, and /account pages are Server Components; /account embeds a ChangePasswordForm client component for the password change form
- ProfileDropdown provides access to subscriptions, bookmarks, account, and logout from the header

## Task Commits

1. **Task 1: Add subscribe/bookmark API endpoints to site-api** - `98541af` (feat)
2. **Task 2: Build subscribe/bookmark UI, auth-aware nav, personalized pages** - `f6ef8c6` (feat)

## Files Created/Modified

- `backend/internal/handler/site_me.go` — GetSubscriptions, Subscribe, Unsubscribe, GetBookmarks, Bookmark, Unbookmark handlers appended
- `backend/cmd/site-api/main.go` — six routes wired in protected group
- `site-app/src/lib/types.ts` — SiteUser interface added
- `site-app/src/components/SubscribeButton.tsx` — optimistic toggle between "عضویت"/"عضو هستید"
- `site-app/src/components/BookmarkButton.tsx` — optimistic filled/outlined bookmark SVG icon
- `site-app/src/components/ProfileDropdown.tsx` — avatar circle with click-outside-aware dropdown menu
- `site-app/src/components/TopNavbar.tsx` — async Server Component with auth state via getCurrentUser()
- `site-app/src/app/page.tsx` — "کانال‌های من" personalized rail for logged-in users
- `site-app/src/app/channel/[id]/page.tsx` — SubscribeButton with server-fetched initial state
- `site-app/src/app/watch/[id]/page.tsx` — bookmark state fetched and passed to WatchClient
- `site-app/src/app/watch/[id]/WatchClient.tsx` — BookmarkButton rendered next to episode title
- `site-app/src/app/subscriptions/page.tsx` — subscribed channels grid with empty state
- `site-app/src/app/bookmarks/page.tsx` — bookmarked episodes grid with empty state
- `site-app/src/app/account/page.tsx` — email display + ChangePasswordForm embed
- `site-app/src/app/account/ChangePasswordForm.tsx` — client form with Persian error messages

## Decisions Made

- **Separate ChangePasswordForm component**: account/page.tsx remains a pure Server Component for data fetching (email from /me); ChangePasswordForm is a dedicated 'use client' file handling its own state and authFetch PUT /me/password call.
- **TopNavbar calls /me for email**: JWT claims only contain user_id and role, not email. One GET /me call per request in the NavBar is acceptable since TopNavbar renders once per page load server-side.
- **N+1 lookups accepted in GetSubscriptions/GetBookmarks**: Each subscription/bookmark triggers a separate FindOne for the channel/episode. For v1 with small user lists this is fine; a $in batch lookup can replace it if needed at scale.
- **409 treated as success in client toggles**: Concurrent taps, stale initial state, or race conditions may trigger duplicate-key errors; the client treats 409 identical to 201 to avoid confusing the user with error messages for harmless races.

## Deviations from Plan

None — plan executed exactly as written. The plan already incorporated the tokenFromSiteCookie deviation from Plan 04-01 (new routes added inside the existing protected group as instructed).

## Issues Encountered

None.

## Self-Check: PASSED

All files confirmed present. All commits verified in git log.

## Next Phase Readiness

- Plan 03 and 04 are subsumed into this plan — subscriptions, bookmarks, and account are all complete
- Phase 5 (final polish/deployment) can proceed; all auth-dependent personalization features are live
- The N+1 lookup in GetSubscriptions/GetBookmarks is a known optimization opportunity documented for post-v1 if needed
