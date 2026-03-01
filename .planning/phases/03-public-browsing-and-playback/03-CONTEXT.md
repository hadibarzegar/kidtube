# Phase 3: Public Browsing and Playback - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Any visitor can browse the platform by category and age group, search for content, open a channel, and watch a video with full player controls — no account required. This phase delivers the entire kid-facing frontend: homepage, browse pages, channel pages, search, and video playback with HLS streaming.

</domain>

<decisions>
## Implementation Decisions

### Homepage layout
- Featured section: Horizontal scrollable rail (Netflix-style) showcasing featured channels/episodes — no auto-rotation, user swipes/scrolls
- Below featured rail: One horizontal scrollable row per category, each showing episodes from that category
- Age group filtering: Persistent tabs at the top of the page (e.g., "همه", "۲-۵ سال", "۶-۱۰ سال") — switching filters the entire homepage content
- Card density: 4-5 large cards visible per row before scrolling — prioritizing big thumbnails and easy tap targets for young children

### Video player
- End-of-video behavior: Auto-play next episode with a 5-10 second countdown overlay showing the next episode preview; user can cancel
- Controls style: Clean, modern, large controls — similar to YouTube Kids aesthetic (big play button, accessible seek bar) but not cartoon-like; professional feel with good contrast
- Speed control placement: Behind a gear/settings icon in the player — keeps main controls clean; speed is a secondary feature
- Player page layout: Episode title, description, and channel link below the player, followed by a list of other episodes from the same channel
- Player controls must NOT be mirrored by RTL layout (explicit dir="ltr" on controls wrapper)

### Browse & navigation
- Main navigation: Bottom tab bar on mobile (خانه, دسته‌بندی, جستجو); top navbar on desktop — mobile-first like YouTube Kids
- Search UX: Search icon in header that opens a full-screen search overlay with instant results as the user types
- Category browse pages: Show channels in that category first — tap a channel to see its episodes (clean hierarchy)
- Channel page: Episodes displayed as a responsive grid of thumbnail cards
- All navigation flows right-to-left; back button direction is RTL-correct

### Visual style
- Overall tone: Bright and playful — saturated colors, rounded corners, playful typography, clearly a kids' platform
- Thumbnail cards: Large rounded corners (16px+), soft drop shadows, hover/press animation — tactile, card-like feel
- Theme: Light only — no dark mode; bright colorful is better for kids, reduces complexity
- All UI text in Persian using Vazirmatn font (already configured in Phase 1)

### Claude's Discretion
- Color palette selection (kid-friendly palette that works well with Persian typography and Vazirmatn font)
- Loading skeleton designs and transitions
- Exact spacing, typography scale, and responsive breakpoints
- Error state and empty state designs
- Search result ranking and display format

</decisions>

<specifics>
## Specific Ideas

- Homepage should feel Netflix-like with horizontal scrollable rows per category
- Player controls should have a YouTube Kids quality — large, clean, professional but kid-appropriate
- Touch targets must be 60px+ on mobile for all interactive elements
- No external links or ads anywhere in the player or browsing experience
- Persian subtitles must render correctly with WebVTT direction:rtl

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-public-browsing-and-playback*
*Context gathered: 2026-03-01*
