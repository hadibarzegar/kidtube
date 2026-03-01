---
phase: 03-public-browsing-and-playback
plan: 04
subsystem: ui
tags: [nextjs, typescript, videojs, hls, autoplay, countdown, rtl, persian, tailwind, responsive]

# Dependency graph
requires:
  - phase: 03-03
    provides: VideoPlayer with onEnded callback, VideoPlayerWrapper SSR-disabled, watch page Server Component
  - phase: 03-02
    provides: ThumbnailCard, BottomTabBar, shared TypeScript types (Episode, Channel)

provides:
  - CountdownOverlay client component with 7-second Persian countdown, cancel and play-now buttons
  - WatchClient client component orchestrating player + countdown + autoplay-next navigation
  - Updated watch page.tsx passing nextEpisode (order+1) to WatchClient
  - Enhanced Video.js CSS: high-contrast control bar, enlarged seek thumb, speed control styling

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server/Client split for watch page: Server Component fetches data + computes nextEpisode, WatchClient handles interactivity"
    - "Autoplay pattern: onEnded -> setShowCountdown(true) -> CountdownOverlay -> router.push or cancel"
    - "Countdown overlay: useEffect interval decrements seconds; clearInterval on unmount; onProceed called at 0"

key-files:
  created:
    - site-app/src/components/CountdownOverlay.tsx
    - site-app/src/app/watch/[id]/WatchClient.tsx
  modified:
    - site-app/src/app/watch/[id]/page.tsx
    - site-app/src/app/globals.css

key-decisions:
  - "WatchClient wraps VideoPlayer and CountdownOverlay together — relative positioning allows overlay to float above player"
  - "nextEpisode computed server-side in page.tsx via allEpisodes.find(ep => ep.order === episode.order + 1) — avoids client-side array work"
  - "CountdownOverlay uses setInterval not setTimeout chain — simpler cleanup with clearInterval in useEffect return"
  - "useCallback on onEnded/onProceed/onCancel prevents VideoPlayer re-render thrashing from new function references"

patterns-established:
  - "Autoplay countdown pattern: absolute overlay div with bg-black/50 over relative player container"
  - "Persian countdown text: 'قسمت بعدی در {seconds} ثانیه' with next episode title and order number"

requirements-completed: [PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07, RTL-03, RTL-05, BROW-06, BROW-07]

# Metrics
duration: 1min
completed: 2026-03-01
---

# Phase 3 Plan 04: Autoplay-Next Countdown and Responsive Polish Summary

**Autoplay-next episode with 7-second Persian countdown overlay, WatchClient orchestrating player and navigation, and Video.js CSS polish for high-contrast controls and larger interactive targets**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T10:07:12Z
- **Completed:** 2026-03-01T10:08:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- CountdownOverlay client component: useEffect interval counts down from 7; calls onProceed at 0; cancel/play-now buttons with Persian text (لغو / پخش) and min-h-[48px] touch targets; absolute overlay floats over player
- WatchClient client component: wraps VideoPlayer and CountdownOverlay in a relative container; useCallback-wrapped onEnded/onProceed/onCancel prevent unnecessary re-renders; router.push navigates to next episode
- Watch page.tsx refactored to Server Component data-only: computes nextEpisode by order+1, passes episode/nextEpisode/channel to WatchClient; other episodes grid remains server-rendered
- Video.js CSS polish: high-contrast control bar (rgba 0,0,0,0.7), enlarged seek thumb (1.4em), speed control button (1.1em) — all kid-friendly improvements
- All pre-existing audited: touch targets (60px+ BottomTabBar, ThumbnailCard; 48px+ AgeFilterTabs, SearchOverlay input), Persian text across all components, RTL right-pointing back buttons, iPhone safe-area padding on BottomTabBar

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CountdownOverlay and WatchClient components for autoplay-next functionality** - `c0357d6` (feat)
2. **Task 2: Responsive polish — verify touch targets, Persian text, RTL navigation, and player CSS** - `b000e0e` (feat)

## Files Created/Modified
- `site-app/src/components/CountdownOverlay.tsx` - 'use client' countdown overlay: 7-second interval, Persian text, cancel/play-now buttons, absolute positioning over player
- `site-app/src/app/watch/[id]/WatchClient.tsx` - 'use client' orchestrator: VideoPlayer + CountdownOverlay state, onEnded/onProceed/onCancel callbacks, router.push navigation
- `site-app/src/app/watch/[id]/page.tsx` - Refactored to pass nextEpisode (order+1) to WatchClient; other episodes grid stays server-rendered
- `site-app/src/app/globals.css` - Added high-contrast control bar, enlarged seek thumb, speed control button size overrides

## Decisions Made
- WatchClient wraps both VideoPlayer and CountdownOverlay inside a `relative` div — enables `absolute inset-0` overlay to float over the player
- nextEpisode computed server-side in page.tsx using `allEpisodes.find(ep => ep.order === episode.order + 1)` — clean and avoids shipping episode list to client
- useCallback wrappers on all VideoPlayer callbacks prevent new function references on each WatchClient render from triggering VideoPlayer useEffect re-runs
- Countdown uses setInterval (not recursive setTimeout) for simpler cleanup in useEffect return

## Deviations from Plan

None - plan executed exactly as written. All audited components already met requirements from Plans 03-02 and 03-03. Only the CSS additions to globals.css were new work.

## Issues Encountered
None — all components were already polished from prior plans. Task 2 was primarily verification with one CSS enhancement.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 public browsing and playback is complete: homepage, category browse, channel page, search, watch page with autoplay-next
- All kid-facing pages use Persian text, RTL layout, touch-friendly targets, and have no ads or external links
- Video.js player: HLS streaming, playback speed control (0.75x/1x/1.25x/1.5x), Persian subtitle VTT support, autoplay-next with 7-second countdown
- Phase 3 risk note: Persian VTT RTL cue rendering in Video.js needs hands-on browser testing when real subtitle content is available

## Self-Check: PASSED

- CountdownOverlay.tsx: FOUND
- WatchClient.tsx: FOUND
- watch/page.tsx: FOUND
- globals.css: FOUND
- 03-04-SUMMARY.md: FOUND
- Commit c0357d6 (Task 1): FOUND
- Commit b000e0e (Task 2): FOUND

---
*Phase: 03-public-browsing-and-playback*
*Completed: 2026-03-01*
