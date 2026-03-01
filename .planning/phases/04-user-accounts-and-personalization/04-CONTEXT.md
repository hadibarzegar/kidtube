# Phase 4: User Accounts and Personalization - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Optional user accounts that unlock channel subscriptions and episode bookmarks. All existing content (homepage, channels, episodes, video playback) remains fully accessible to visitors who are not logged in. Scope: registration, login, JWT session, subscribe/bookmark actions, dedicated saved-items pages, admin user list. No email verification, no social login, no notifications.

</domain>

<decisions>
## Implementation Decisions

### Registration & Login Flow
- Dedicated pages at `/login` and `/register` (not modals) — consistent with existing site-app routing
- No email verification for v1 — register and immediately use all account features
- Registration collects email + password only — minimal friction
- Centered card with logo on a subtle background — clean, kid-friendly, matches existing site style
- All form labels and error messages in Persian RTL

### Subscribe & Bookmark UX
- Subscribe action is a text button: "عضویت" (Subscribe) that toggles to "عضو هستید" (Subscribed) — clear and accessible for kids
- Bookmark action is a bookmark icon on episode cards and on the watch page — tap to save, fills when bookmarked
- Dedicated separate pages: `/subscriptions` and `/bookmarks` accessible from the profile dropdown menu
- Guest tapping subscribe/bookmark gets redirected to `/login` with a return URL so they come back after logging in

### Guest vs Logged-in Navigation
- Guest sees a "ورود / ثبت‌نام" (Login/Register) button in the header
- Logged-in user sees a small avatar/initial circle replacing the login button; dropdown opens with links to subscriptions, bookmarks, and logout
- Sign-up CTA is subtle — just the header button, not pushy (kids platform shouldn't pressure sign-ups)
- Homepage shows a personalized "کانال‌های من" (My Channels) rail at the top for logged-in users with their subscribed channels

### Account Info & Profile
- Minimal settings page showing email with a change-password form — no profile customization for v1
- Admin users table shows: email, registration date, login status — basic visibility for v1

### Claude's Discretion
- Exact password validation rules (minimum length, complexity)
- Avatar/initial circle design and color assignment
- Loading states and error handling patterns
- Form validation UX (inline vs. on-submit)
- Empty state illustrations for subscriptions/bookmarks pages
- Admin users table pagination and sorting

</decisions>

<specifics>
## Specific Ideas

- Subscribe button uses familiar YouTube-style toggle pattern ("عضویت" → "عضو هستید")
- Bookmark icon follows standard bookmark silhouette (not heart/like)
- Profile dropdown follows the pattern of avatar circle → dropdown menu (like YouTube/Google)
- "My Channels" rail on homepage similar to YouTube's subscriptions shelf
- Login redirect preserves the exact page the user was on via return URL parameter

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-user-accounts-and-personalization*
*Context gathered: 2026-03-01*
