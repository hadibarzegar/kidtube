---
phase: 03-public-browsing-and-playback
plan: 02
subsystem: ui
tags: [nextjs, react, tailwind, persian, rtl, server-components, scroll-snap]

# Dependency graph
requires:
  - phase: 03-01
    provides: "site-api public endpoints (channels, episodes, categories, age-groups, search) and apiServerFetch/apiFetch helpers"

provides:
  - "ThumbnailCard: reusable large rounded card with image, title, subtitle, shadow, 60px+ touch targets"
  - "HorizontalRail: scroll-snap horizontal row component with optional view-all link"
  - "AgeFilterTabs: client component for URL-param-based age group filtering"
  - "BottomTabBar: fixed mobile bottom nav with 3 tabs (home/browse/search), safe-area inset"
  - "TopNavbar: desktop-only sticky header with logo and nav links"
  - "SearchOverlay: full-screen client-side search with 300ms debounce and instant results"
  - "Homepage with featured episode rail and per-category channel rails"
  - "Browse page with category grid"
  - "Category page filtering channels by category"
  - "Channel page with hero banner, description, and episode grid"
  - "Search page rendering SearchOverlay full-screen"

affects:
  - "03-03-video-player"
  - "03-04-subtitles"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL search params for age filter (not client state) — keeps page as Server Component, SEO-friendly"
    - "Suspense boundary around AgeFilterTabs since useSearchParams requires it in Next.js 15"
    - "Parallel Promise.all fetches in Server Components for homepage and category pages"
    - "CSS scroll-snap (snap-x snap-mandatory) for horizontal rails — no JS carousel library"
    - "scrollbar-hide CSS utility class for hidden scrollbars on rails"
    - "Inline SVG icons in BottomTabBar — no icon library added"

key-files:
  created:
    - site-app/src/components/ThumbnailCard.tsx
    - site-app/src/components/HorizontalRail.tsx
    - site-app/src/components/AgeFilterTabs.tsx
    - site-app/src/components/BottomTabBar.tsx
    - site-app/src/components/TopNavbar.tsx
    - site-app/src/components/SearchOverlay.tsx
    - site-app/src/app/browse/page.tsx
    - site-app/src/app/browse/[categoryId]/page.tsx
    - site-app/src/app/channel/[id]/page.tsx
    - site-app/src/app/search/page.tsx
    - site-app/src/lib/types.ts
  modified:
    - site-app/src/app/layout.tsx
    - site-app/src/app/page.tsx
    - site-app/src/app/globals.css

key-decisions:
  - "URL-param approach for age filter (/?age_group_id=xxx) — simpler than client state, pure Server Component, SEO-friendly"
  - "Suspense boundary around AgeFilterTabs — required by Next.js 15 when useSearchParams is used in a subtree of a Server Component"
  - "Shared types in lib/types.ts — avoids repeating inline type definitions across 10+ files"
  - "BottomTabBar hides on /watch/* routes (linter enhancement) — prevents bottom bar overlapping video player controls"
  - "Inline SVGs for navigation icons — avoids adding icon library dependency"
  - "next/image for channel thumbnails — automatic optimization; fallback gradient placeholder for missing thumbnails"

patterns-established:
  - "ThumbnailCard: consistent rounded-2xl, shadow-md, hover:scale, 60px+ touch target pattern for all content cards"
  - "HorizontalRail: snap-x scroll container with section heading as standard section component"
  - "Server Component parallel fetch: Promise.all for independent data on each page"
  - "RTL back button: chevron pointing right (polyline points 9-18 15-12 9-6) = back in RTL"

requirements-completed: [BROW-01, BROW-02, BROW-03, BROW-04, BROW-06, BROW-07, RTL-03, RTL-05, AUTH-04]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 3 Plan 02: Public Browsing UI Summary

**Kid-facing Next.js frontend with Netflix-style horizontal rails, Persian RTL navigation shell, age-filter tabs, and full-screen search — complete browsing experience from homepage to channel pages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T10:00:37Z
- **Completed:** 2026-03-01T10:04:22Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Six reusable components covering all navigation and content display needs (ThumbnailCard, HorizontalRail, AgeFilterTabs, BottomTabBar, TopNavbar, SearchOverlay)
- Five pages built as Next.js 15 Server Components fetching from site-api in parallel, with client components only where interactivity is needed (AgeFilterTabs, SearchOverlay, BottomTabBar)
- Full responsive layout: bottom tab bar on mobile (md:hidden), top navbar on desktop (hidden md:flex), with safe-area inset for iPhone notch

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reusable components and update navigation shell** - `d54dd5a` (feat)
2. **Task 2: Build homepage, browse, channel, and search pages** - `72bbfb3` (feat)

## Files Created/Modified

- `site-app/src/components/ThumbnailCard.tsx` - Large rounded card with image, title, subtitle, hover animation, 60px+ touch target
- `site-app/src/components/HorizontalRail.tsx` - snap-x horizontal scroll row with title and optional view-all link
- `site-app/src/components/AgeFilterTabs.tsx` - Client tab strip using useRouter to push URL param; Suspense-compatible
- `site-app/src/components/BottomTabBar.tsx` - Fixed bottom nav with 3 tabs, safe-area inset, hides on /watch/*
- `site-app/src/components/TopNavbar.tsx` - Desktop-only sticky header with logo (right/RTL) and nav links
- `site-app/src/components/SearchOverlay.tsx` - Full-screen search, 300ms debounce, apiFetch, channels+episodes results
- `site-app/src/app/page.tsx` - Homepage: parallel fetch, AgeFilterTabs, featured rail, per-category rails
- `site-app/src/app/browse/page.tsx` - Category grid with cycling accent colors, min-h-120px cards
- `site-app/src/app/browse/[categoryId]/page.tsx` - Channel grid for a category with RTL back button
- `site-app/src/app/channel/[id]/page.tsx` - Hero banner, description, episode grid; 404 handling
- `site-app/src/app/search/page.tsx` - Thin client wrapper for SearchOverlay
- `site-app/src/lib/types.ts` - Shared TypeScript types: Channel, Episode, Category, AgeGroup
- `site-app/src/app/layout.tsx` - Root layout with TopNavbar + BottomTabBar, pb-20 md:pb-0
- `site-app/src/app/globals.css` - Added scrollbar-hide utility and kid-friendly CSS color variables

## Decisions Made

- URL-param approach for age filter (/?age_group_id=xxx) — chosen over client state so the page stays a pure Server Component and the selected filter is bookmarkable/shareable
- Suspense boundary wraps AgeFilterTabs — required by Next.js 15 because useSearchParams() in a client component that's a child of a Server Component requires Suspense
- Shared types extracted to lib/types.ts — avoids duplicate inline type definitions across the ~10 consuming files
- Inline SVGs for BottomTabBar icons — avoids pulling in an icon library dependency for three simple icons

## Deviations from Plan

None - plan executed exactly as written. One linter enhancement was accepted: BottomTabBar returns null on /watch/* routes to prevent the bottom bar from overlapping video player controls.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All browsing pages are complete and reference `/watch/{episode_id}` links, which Plan 03-03 will build
- ThumbnailCard is ready to be reused by any future page
- SearchOverlay is wired to /api/site/search via the nginx proxy established in Phase 01
- Potential concern: AgeFilterTabs requires Suspense; other pages using useSearchParams must follow the same pattern

---
*Phase: 03-public-browsing-and-playback*
*Completed: 2026-03-01*

## Self-Check: PASSED

All 12 created/modified files confirmed present on disk. Task commits d54dd5a and 72bbfb3 confirmed in git log.
