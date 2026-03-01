---
phase: 03-public-browsing-and-playback
plan: 03
subsystem: ui
tags: [nextjs, typescript, videojs, hls, adaptive-bitrate, video-player, react, rtl, tailwind]

# Dependency graph
requires:
  - phase: 03-01
    provides: apiServerFetch helper, site-api public episodes and channels endpoints
  - phase: 03-02
    provides: ThumbnailCard component, BottomTabBar component, shared TypeScript types (Episode, Channel)

provides:
  - Video.js 8 HLS player component (VideoPlayer.tsx) with fluid responsive layout, subtitle support, and dispose cleanup
  - VideoPlayerWrapper with next/dynamic ssr:false for safe SSR-disabled client rendering
  - Watch page (/watch/[id]) with HLS playback, episode info, channel link, and related episodes grid
  - Kid-friendly CSS overrides: 80px round play button, enlarged control bar
  - BottomTabBar hidden on /watch/* pages to avoid overlapping player controls

affects:
  - 03-04 (autoplay countdown overlay wires into onEnded callback in VideoPlayer)

# Tech tracking
tech-stack:
  added:
    - "video.js@^8.x — HLS adaptive bitrate streaming player with bundled VHS (videojs-http-streaming)"
  patterns:
    - "VideoPlayer/VideoPlayerWrapper split: VideoPlayer is 'use client' with useRef+useEffect+dispose; VideoPlayerWrapper uses next/dynamic ssr:false in a 'use client' file"
    - "dir=ltr on player wrapper: prevents RTL page layout from mirroring video player controls"
    - "Watch page as Server Component: fetches episode+channel data server-side, imports VideoPlayerWrapper (Client Component)"
    - "BottomTabBar early return: usePathname check hides tab bar on /watch/* routes"

key-files:
  created:
    - site-app/src/components/VideoPlayer.tsx
    - site-app/src/components/VideoPlayerWrapper.tsx
    - site-app/src/app/watch/[id]/page.tsx
  modified:
    - site-app/package.json
    - site-app/package-lock.json
    - site-app/src/app/globals.css
    - site-app/src/components/BottomTabBar.tsx

key-decisions:
  - "Video.js uses document/window at import time — dynamic import with ssr:false MUST be called in a 'use client' file (VideoPlayerWrapper), not a Server Component"
  - "dir=ltr on player wrapper div prevents RTL page dir from reversing playback controls (PLAY-07)"
  - "vjs-big-play-centered class on video-js element positions play button at center (PLAY-05)"
  - "dispose() called in separate useEffect cleanup function to free media streams on unmount (memory safety)"
  - "Watch page uses Promise.all to fetch channel and episodes list in parallel after getting episode"
  - "Watch page imports Episode/Channel types from shared @/lib/types to avoid duplication"

patterns-established:
  - "HLS player pattern: videojs(el, { responsive: true, fluid: true, sources: [{ type: 'application/x-mpegURL' }] })"
  - "SSR-disabled client component: dynamic import in 'use client' wrapper, not Server Component"

requirements-completed: [PLAY-01, PLAY-05, PLAY-06, PLAY-07]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 3 Plan 03: Video.js HLS Player and Watch Page Summary

**Video.js 8 HLS player wrapped in an SSR-disabled client component, with a watch page Server Component that fetches episode data and renders the player alongside episode info and a related episodes grid**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T10:00:56Z
- **Completed:** 2026-03-01T10:02:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- VideoPlayer client component: Video.js 8 initialized with HLS source (application/x-mpegURL), fluid/responsive layout, vjs-big-play-centered, playbackRates, subtitle track support (Persian VTT), onEnded callback, and dispose() cleanup on unmount
- VideoPlayerWrapper: next/dynamic with ssr:false in a 'use client' file with loading skeleton spinner — safe pattern that prevents Video.js document/window SSR crash
- Watch page Server Component: parallel fetches for channel + episode list after episode fetch, VideoPlayerWrapper rendered with HLS source, episode title/description/channel link, related episodes ThumbnailCard grid
- Kid-friendly CSS: 80px round play button in blue (#3B82F6), 4em control bar height, 0.8em progress bar height
- BottomTabBar hidden on /watch/* routes via usePathname early return — prevents overlapping video player controls

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Video.js and create VideoPlayer + VideoPlayerWrapper components** - `2ee15d7` (feat)
2. **Task 2: Create watch page with player, episode info, and related episodes list** - `1f6d3e3` (feat)

## Files Created/Modified
- `site-app/src/components/VideoPlayer.tsx` - 'use client' component: Video.js 8 init with HLS, subtitle tracks, playbackRates, onEnded hook, dispose() cleanup; dir="ltr" wrapper
- `site-app/src/components/VideoPlayerWrapper.tsx` - 'use client' wrapper using next/dynamic ssr:false with loading spinner skeleton
- `site-app/src/app/watch/[id]/page.tsx` - Server Component watch page: episode fetch, channel + related episodes parallel fetch, VideoPlayer render, episode info section, related episodes grid, generateMetadata
- `site-app/package.json` - video.js added as dependency
- `site-app/package-lock.json` - updated lock file (19 packages added)
- `site-app/src/app/globals.css` - Video.js kid-friendly CSS overrides for play button and control bar
- `site-app/src/components/BottomTabBar.tsx` - Added /watch/* pathname check to return null (already committed in 03-02)

## Decisions Made
- VideoPlayerWrapper must be a 'use client' file — next/dynamic ssr:false in a Server Component throws a runtime error because dynamic() is a Client API
- dir="ltr" on player wrapper div is required because the root html tag has dir="rtl"; without it, the Video.js control bar renders mirrored
- Watch page uses Promise.all to parallelize channel and episodes fetches after getting the episode document
- Types imported from shared @/lib/types (created in plan 03-02) to avoid duplicate interface definitions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used shared type imports instead of redefining Episode/Channel interfaces**
- **Found during:** Task 2 (watch page implementation)
- **Issue:** Plan specified defining Episode/Channel interfaces inline in the watch page, but plan 03-02 had already created shared types in @/lib/types.ts; duplicating would cause divergence
- **Fix:** Imported Episode and Channel types from @/lib/types instead of redefining them
- **Files modified:** site-app/src/app/watch/[id]/page.tsx
- **Verification:** TypeScript types resolved correctly
- **Committed in:** 1f6d3e3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug/duplication)
**Impact on plan:** Minor improvement. Uses existing shared types instead of duplicating. No scope creep.

## Issues Encountered
None — plan executed cleanly. BottomTabBar hide-on-watch logic was already committed as part of plan 03-02 execution.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VideoPlayer ready with onEnded callback hook for plan 03-04 autoplay countdown overlay
- Watch page fully functional: HLS streaming, episode info, channel link, related episodes
- All requirements met: PLAY-01 (HLS), PLAY-05 (large centered play button), PLAY-06 (no ads/external links), PLAY-07 (RTL control fix)
- Phase 3 risk note: Persian VTT RTL cue rendering needs hands-on browser testing when real content is available

---
*Phase: 03-public-browsing-and-playback*
*Completed: 2026-03-01*
