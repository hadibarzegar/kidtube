# Phase 3: Public Browsing and Playback - Research

**Researched:** 2026-03-01
**Domain:** Next.js 16 Server Components, Video.js 8 HLS, Go chi REST API, MongoDB search, RTL Persian UI
**Confidence:** HIGH (core stack), MEDIUM (Persian subtitle rendering), MEDIUM (MongoDB search strategy)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Homepage layout**
- Featured section: Horizontal scrollable rail (Netflix-style) showcasing featured channels/episodes — no auto-rotation, user swipes/scrolls
- Below featured rail: One horizontal scrollable row per category, each showing episodes from that category
- Age group filtering: Persistent tabs at the top of the page (e.g., "همه", "۲-۵ سال", "۶-۱۰ سال") — switching filters the entire homepage content
- Card density: 4-5 large cards visible per row before scrolling — prioritizing big thumbnails and easy tap targets for young children

**Video player**
- End-of-video behavior: Auto-play next episode with a 5-10 second countdown overlay showing the next episode preview; user can cancel
- Controls style: Clean, modern, large controls — similar to YouTube Kids aesthetic (big play button, accessible seek bar) but not cartoon-like; professional feel with good contrast
- Speed control placement: Behind a gear/settings icon in the player — keeps main controls clean; speed is a secondary feature
- Player page layout: Episode title, description, and channel link below the player, followed by a list of other episodes from the same channel
- Player controls must NOT be mirrored by RTL layout (explicit dir="ltr" on controls wrapper)

**Browse & navigation**
- Main navigation: Bottom tab bar on mobile (خانه, دسته‌بندی, جستجو); top navbar on desktop — mobile-first like YouTube Kids
- Search UX: Search icon in header that opens a full-screen search overlay with instant results as the user types
- Category browse pages: Show channels in that category first — tap a channel to see its episodes (clean hierarchy)
- Channel page: Episodes displayed as a responsive grid of thumbnail cards
- All navigation flows right-to-left; back button direction is RTL-correct

**Visual style**
- Overall tone: Bright and playful — saturated colors, rounded corners, playful typography, clearly a kids' platform
- Thumbnail cards: Large rounded corners (16px+), soft drop shadows, hover/press animation — tactile, card-like feel
- Theme: Light only — no dark mode
- All UI text in Persian using Vazirmatn font (already configured in Phase 1)

### Claude's Discretion
- Color palette selection (kid-friendly palette that works well with Persian typography and Vazirmatn font)
- Loading skeleton designs and transitions
- Exact spacing, typography scale, and responsive breakpoints
- Error state and empty state designs
- Search result ranking and display format

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BROW-01 | Homepage displays featured/trending content rail and category sections | Horizontal scroll snap with Tailwind; Server Component fetch on page render |
| BROW-02 | User can browse channels grouped by category | site-api GET /channels?category_id=; category browse page |
| BROW-03 | User can browse channels filtered by age group (2-5, 6-10) | site-api GET /channels?age_group_id=; tab filter UI in Server+Client Components |
| BROW-04 | User can view a channel page with channel art, description, and episode list | site-api GET /channels/:id + GET /episodes?channel_id=; channel page Server Component |
| BROW-05 | User can search for videos and channels by title | site-api GET /search?q=; MongoDB case-insensitive regex on name/title fields |
| BROW-06 | All browsing pages use large thumbnail cards suitable for children | ThumbnailCard component; 16px+ border-radius; min 60px touch target |
| BROW-07 | All pages are fully responsive (mobile, tablet, desktop) with 60px+ touch targets | Tailwind responsive classes; min-h-[60px] min-w-[60px] on interactive elements |
| PLAY-01 | Video player plays HLS streams with adaptive bitrate switching | Video.js 8 + videojs-http-streaming (VHS) built-in; src type application/x-mpegURL |
| PLAY-02 | Player has playback speed control (0.75x, 1x, 1.25x, 1.5x) | Video.js native playbackRates option; placed behind settings gear |
| PLAY-03 | Player auto-plays next episode when current episode ends | player.on('ended', ...) event; custom countdown overlay React component |
| PLAY-04 | Player displays Persian subtitles with correct RTL rendering (WebVTT with direction:rtl) | Video.js text tracks; VTT cue with direction:rtl; browser-rendered cues |
| PLAY-05 | Player uses large, kid-friendly controls (big play button, accessible seek bar) | vjs-big-play-centered; custom CSS overrides on Video.js skin |
| PLAY-06 | Player contains no external links or ads | No ad plugins; no sharing components; controlled episode list only |
| PLAY-07 | Player controls are NOT mirrored in RTL layout (explicit dir="ltr" on controls) | Explicit dir="ltr" on player wrapper div; Video.js controls render in DOM order |
| RTL-03 | Navigation flows right-to-left; back buttons point right | dir="rtl" on html (already done); RTL-aware Tailwind logical properties; back icon flipped |
| RTL-05 | All UI text is in Persian (admin panel may be English) | Vazirmatn font already configured; all copy written in Persian strings |
| AUTH-04 | All content is viewable without login — accounts are optional | site-api has no auth middleware; no JWT required for public routes |
</phase_requirements>

---

## Summary

Phase 3 spans two systems: the **Go site-api** (new public REST endpoints in `backend/cmd/site-api/`) and the **Next.js site-app** (the entire kid-facing frontend). The site-api currently only has a health endpoint; all browse/play endpoints need to be built. The site-app has a skeleton layout with RTL and Vazirmatn already wired; this phase builds everything inside it.

The most technically interesting part is the **Video.js 8 integration in Next.js 16 App Router**. Video.js uses DOM APIs that don't exist on the server, so the player component must be a Client Component imported via `next/dynamic` with `ssr: false`. The decision to use Video.js 8.23 was made pre-phase (Vidstack had unresolved React 19 compatibility issues). Video.js 8 bundles `videojs-http-streaming` (VHS) natively — no separate HLS library needed.

The **Persian subtitle RTL** situation requires care: VTT cues can specify `direction:rtl` in their cue settings line, and most modern browsers respect this. However browser-rendered VTT cue boxes are styled independently of Video.js and the page's `dir` attribute — they are positioned by the browser's text track engine, not CSS. Hands-on validation is essential because behavior varies across browsers and OS text rendering engines. The **player controls RTL** problem is separate and simpler: wrapping the Video.js container in `div dir="ltr"` prevents the RTL page layout from reversing seek bar direction and control order.

**MongoDB search for Persian:** MongoDB's built-in `$text` index uses a stemmer/tokenizer. Persian/Farsi is listed as a supported language for MongoDB Enterprise text indexes, but on Community (which this project uses in Docker), the `"none"` language setting or case-insensitive regex is the reliable fallback. Use `bson.Regex{Pattern: regexp.QuoteMeta(q), Options: "i"}` across name/title fields — it works correctly with Persian Unicode and needs no special index.

**Primary recommendation:** Build site-api public endpoints first (Plan 03-01), then pages/navigation (Plan 03-02), then Video.js player (Plan 03-03), then subtitle/speed/autoplay polish (Plan 03-04). Do not block on subtitle RTL — implement it and validate during integration.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 (installed) | Site app framework, Server Components, routing | Already in project; App Router is the current standard |
| React | 19.2.3 (installed) | UI component model | Already in project |
| Tailwind CSS | 4.x (installed) | Utility styling, responsive, scroll snap | Already in project; v4 uses @theme blocks |
| Video.js | 8.23.x | HLS video player | Pre-phase decision; bundles VHS for ABR out of the box |
| video.js/dist/video-js.css | (bundled with video.js) | Player skin | Required alongside the JS |
| Go chi/v5 | 5.2.5 (installed) | site-api routing | Already in backend; consistent with admin-api |
| mongo-driver/v2 | 2.5.0 (installed) | MongoDB queries in Go | Already in project; v2 API (bson.ObjectID, not primitive) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vazirmatn | 33.0.3 (installed) | Persian font | Already configured; no additional work needed |
| next/dynamic | (built-in Next.js) | Client-only dynamic import | Required for Video.js player to skip SSR |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Video.js 8 | Vidstack | Vidstack has unresolved React 19 issues (locked decision — use Video.js 8) |
| Video.js 8 | HLS.js + custom controls | More control but ~3x implementation effort; Video.js gives kid-friendly UI for free |
| MongoDB regex search | MongoDB $text index | $text has better relevance scoring but Persian stemming unreliable on Community edition; regex is simpler and predictably correct |

**Installation:**
```bash
# In site-app/
npm install video.js
npm install --save-dev @types/video.js
```

---

## Architecture Patterns

### Recommended Project Structure

```
backend/cmd/site-api/         # New: public REST API binary
  main.go                     # Mirrors admin-api/main.go without auth/worker

backend/internal/handler/
  site_channel.go             # Public ListChannels, GetChannel (no auth)
  site_episode.go             # Public ListEpisodes, GetEpisode (no auth)
  site_category.go            # Public ListCategories
  site_age_group.go           # Public ListAgeGroups
  site_search.go              # GET /search?q=&type=channels|episodes|all

site-app/src/
  app/
    layout.tsx                # UPDATE: full navigation shell (bottom bar mobile, top navbar desktop)
    page.tsx                  # UPDATE: homepage with age-filter tabs + category rails
    browse/
      page.tsx                # Category list page
      [categoryId]/page.tsx   # Channel list for a category
    age/
      [ageGroupId]/page.tsx   # Channels filtered by age group
    channel/
      [id]/page.tsx           # Channel detail: art, description, episode grid
    watch/
      [id]/page.tsx           # Video player page + episode list sidebar
    search/
      page.tsx                # Full-screen search results (client component)
  components/
    ThumbnailCard.tsx          # Reusable card: thumbnail, title, rounded-2xl, shadow
    HorizontalRail.tsx         # Horizontal scroll snap row with label
    AgeFilterTabs.tsx          # "همه" / "۲-۵ سال" / "۶-۱۰ سال" tab strip (client)
    VideoPlayer.tsx            # 'use client'; dynamic import ssr:false wrapper
    CountdownOverlay.tsx       # Auto-play next episode countdown (client)
    SearchOverlay.tsx          # Full-screen search UI (client)
    BottomTabBar.tsx           # Mobile navigation (client, md:hidden)
    TopNavbar.tsx              # Desktop navigation (server-renderable)
  lib/
    api.ts                    # NEW: site-api fetch helpers (mirrors admin-app pattern)
```

### Pattern 1: Site-API Public Handler (no auth)

The site-api follows the exact same handler factory pattern as admin-api handlers, but registered without `jwtauth` middleware. Reuse the same internal handler package — simply register the functions on the chi router without the auth group.

```go
// backend/cmd/site-api/main.go — public routes, no JWT middleware
r := chi.NewRouter()
r.Use(middleware.RequestID)
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)

r.Get("/healthz", handler.HealthHandler(database))
r.Get("/channels", handler.ListChannels(database))
r.Get("/channels/{id}", handler.GetChannel(database))
r.Get("/episodes", handler.ListEpisodes(database))   // supports ?channel_id=
r.Get("/episodes/{id}", handler.GetEpisode(database))
r.Get("/categories", handler.ListCategories(database))
r.Get("/age-groups", handler.ListAgeGroups(database))
r.Get("/search", handler.Search(database))           // new handler
```

**Key insight:** The existing admin-api handler functions have no auth logic inside them — auth is applied at the router level. The same `handler.ListChannels`, `handler.ListEpisodes`, etc. can be mounted directly on the public site-api router. No new handler files are needed for basic CRUD read operations.

### Pattern 2: Site-App API Client (mirrors admin-app pattern)

```typescript
// site-app/src/lib/api.ts
const SITE_API_INTERNAL_URL =
  process.env.SITE_API_INTERNAL_URL ?? 'http://localhost:8081'

// Server-side: fetch directly via Docker internal DNS (no credentials needed)
export function apiServerFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${SITE_API_INTERNAL_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}

// Client-side: use nginx proxy at /api/site/* (AUTH-04: no credentials required)
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`/api/site${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}
```

nginx already has `/api/site/` → `http://site_api/` proxy configured. The env var `SITE_API_INTERNAL_URL` must be added to docker-compose.yml for the site-app service (mirrors `ADMIN_API_INTERNAL_URL` pattern).

### Pattern 3: Server Component Data Fetching

Most pages are Server Components fetching from site-api directly. No credentials, no cookies.

```typescript
// site-app/src/app/page.tsx — Server Component
import { apiServerFetch } from '@/lib/api'

async function fetchCategories() {
  const res = await apiServerFetch('/categories', { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function fetchChannelsByCategory(categoryId: string) {
  const res = await apiServerFetch(`/channels?category_id=${categoryId}`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const categories = await fetchCategories()
  const [featured, ...byCategory] = await Promise.all([
    fetchChannelsByCategory(''),   // all channels for featured rail
    ...categories.map((c) => fetchChannelsByCategory(c.id)),
  ])
  // ...
}
```

### Pattern 4: Video.js Player Component (Client Component, SSR disabled)

This is the most critical pattern. Video.js uses `document` and `window` at import time — it must never execute on the server.

```typescript
// site-app/src/components/VideoPlayer.tsx
'use client'

import React, { useRef, useEffect } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  hlsSrc: string          // /hls/{episode_id}/master.m3u8
  subtitleSrc?: string    // subtitle_url from episode doc
  onEnded?: () => void    // triggers countdown overlay
}

export function VideoPlayer({ hlsSrc, subtitleSrc, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoEl = document.createElement('video-js')
      videoEl.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoEl)

      playerRef.current = videojs(videoEl, {
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.75, 1, 1.25, 1.5],
        sources: [{ src: hlsSrc, type: 'application/x-mpegURL' }],
        tracks: subtitleSrc
          ? [{ src: subtitleSrc, kind: 'subtitles', srclang: 'fa', label: 'فارسی', default: true }]
          : [],
      })

      playerRef.current.on('ended', () => {
        onEnded?.()
      })
    }
  }, [hlsSrc, subtitleSrc, onEnded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    // dir="ltr" prevents RTL page from reversing player control layout (PLAY-07)
    <div dir="ltr">
      <div ref={videoRef} />
    </div>
  )
}
```

```typescript
// site-app/src/app/watch/[id]/page.tsx — Server Component wrapper
import dynamic from 'next/dynamic'

// ssr: false must be declared in a Client Component that wraps the dynamic import
// This pattern works in Next.js 16 App Router:
const VideoPlayerNoSSR = dynamic(
  () => import('@/components/VideoPlayer').then(m => ({ default: m.VideoPlayer })),
  { ssr: false }
)
```

**Important Next.js 16 App Router constraint:** `dynamic(..., { ssr: false })` cannot be called in a Server Component file — it must be called in a Client Component wrapper. The cleanest pattern: create `VideoPlayerWrapper.tsx` with `'use client'` that uses `next/dynamic` to import `VideoPlayer`, then import `VideoPlayerWrapper` from the server page.

### Pattern 5: Horizontal Scroll Rail

```typescript
// site-app/src/components/HorizontalRail.tsx
export function HorizontalRail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-3 px-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory
                      scrollbar-hide [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
    </section>
  )
}
```

Each card child gets `snap-start flex-shrink-0` and a fixed width (e.g., `w-48 sm:w-56`). On mobile at 4-5 cards visible: use `w-[calc((100vw-3.5rem)/4.5)]` for fractional visibility signaling scroll affordance.

### Pattern 6: MongoDB Search Handler (site-api)

Persian text search with `$text` index is unreliable on MongoDB Community edition. Use case-insensitive regex across both channels and episodes simultaneously.

```go
// backend/internal/handler/site_search.go
func Search(database *mongo.Database) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    q := strings.TrimSpace(r.URL.Query().Get("q"))
    if q == "" {
      w.Header().Set("Content-Type", "application/json")
      json.NewEncoder(w).Encode(map[string]any{"channels": []any{}, "episodes": []any{}})
      return
    }

    // Case-insensitive regex — safe for Persian Unicode; no special index needed
    pattern := bson.Regex{Pattern: regexp.QuoteMeta(q), Options: "i"}
    filter := bson.D{{Key: "name", Value: bson.D{{Key: "$regex", Value: pattern}}}}

    // Run channel and episode queries in parallel
    var channels []models.Channel
    var episodes []models.Episode
    var wg sync.WaitGroup
    var chanErr, epErr error

    wg.Add(2)
    go func() {
      defer wg.Done()
      cursor, err := database.Collection(db.CollChannels).Find(ctx, filter)
      if err != nil { chanErr = err; return }
      defer cursor.Close(ctx)
      chanErr = cursor.All(ctx, &channels)
    }()
    go func() {
      defer wg.Done()
      epFilter := bson.D{{Key: "title", Value: bson.D{{Key: "$regex", Value: pattern}}}}
      cursor, err := database.Collection(db.CollEpisodes).Find(ctx, epFilter)
      if err != nil { epErr = err; return }
      defer cursor.Close(ctx)
      epErr = cursor.All(ctx, &episodes)
    }()
    wg.Wait()

    // ... handle errors, encode JSON response
  }
}
```

### Pattern 7: RTL Navigation — Back Button

In RTL layouts, "back" means pointing to the right (the reading start direction). The Tailwind class `rotate-180` on a left-pointing chevron SVG produces a right-pointing back arrow correct for RTL. Do not use CSS `scale-x(-1)` — it causes accessibility issues with screen readers that read the icon's `aria-label`.

```typescript
// RTL back button — arrow points right in RTL context
<button aria-label="بازگشت" onClick={() => router.back()}>
  <ChevronRightIcon className="w-6 h-6" /> {/* Right-pointing = RTL back */}
</button>
```

### Anti-Patterns to Avoid

- **Importing Video.js in a Server Component:** Will crash at build time — `document is not defined`. Always import inside a `'use client'` file or via `dynamic(..., { ssr: false })`.
- **Hiding the player instead of disposing it:** Video.js holds media streams and event listeners. Toggling `display:none` causes memory leaks. Always call `player.dispose()` on unmount.
- **Using `$text` index for Persian search on MongoDB Community:** The built-in stemmer does not reliably tokenize Persian. Use regex. Do not add a text index unless testing confirms it works.
- **Applying `dir="rtl"` to the Video.js container:** The player controls (seek bar left-to-right, progress fill left-to-right) are designed for LTR. The `dir="rtl"` from `<html>` must be blocked at the player wrapper. Always add `dir="ltr"` explicitly.
- **Fetching from `localhost:8081` in Server Components inside Docker:** Server Components run inside the `site-app` Docker container. `localhost` resolves to the site-app container itself, not site-api. Use `http://site-api:8081` (Docker service name) set via `SITE_API_INTERNAL_URL` env var.
- **Using `next/dynamic` with `ssr: false` in a Server Component file:** This is not supported in App Router. The `dynamic()` call must be inside a `'use client'` file.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HLS adaptive bitrate | Custom HLS parser | Video.js 8 + built-in VHS | VHS handles segment fetching, bandwidth estimation, rendition switching; thousands of edge cases |
| Video.js CSS skin | Custom player stylesheet | `video.js/dist/video-js.css` + targeted CSS overrides | The base skin handles browser inconsistencies; override only what differs from design |
| ABR quality switching | Manual rendition selection logic | VHS automatic ABR (default behavior) | Bandwidth estimation is a solved, complex problem |
| Persian font loading | Google Fonts CDN | `vazirmatn` npm package + next/font/local | Already implemented in Phase 1; zero layout shift guaranteed |
| Horizontal scroll with touch momentum | Custom scroll JS | CSS `overflow-x: auto` + `-webkit-overflow-scrolling: touch` + `scroll-snap-type: x mandatory` | Native scroll performance; no JS overhead |

**Key insight:** Video.js 8 packages VHS (videojs-http-streaming) as part of its default bundle. There is no separate HLS.js install needed. Setting `type: 'application/x-mpegURL'` on the source automatically activates VHS.

---

## Common Pitfalls

### Pitfall 1: Video.js and React StrictMode Double-Init

**What goes wrong:** In React 18+ StrictMode, `useEffect` runs twice in development. The second run tries to create a second Video.js player on an element that already has one — throwing "videojs: VIDEO_ELEMENT_ALREADY_IN_USE".

**Why it happens:** StrictMode intentionally mounts/unmounts/remounts components to detect side effects. The first mount creates the player; the dismount disposes it (correct); the remount creates a new player on the re-appended element.

**How to avoid:** Guard with `if (!playerRef.current)` before creating the player (already shown in code example above). The cleanup effect that calls `dispose()` and sets `playerRef.current = null` ensures the guard works correctly on remount.

**Warning signs:** Console error "VIDEO_ELEMENT_ALREADY_IN_USE" in development only; works fine in production.

### Pitfall 2: `dynamic({ ssr: false })` in App Router Server Components

**What goes wrong:** Placing `const X = dynamic(() => import(...), { ssr: false })` directly in a `.tsx` file that is a Server Component (no `'use client'`) causes a runtime error or silently renders nothing.

**Why it happens:** `dynamic` with `ssr: false` relies on React's client-side lazy loading mechanism, which doesn't exist in Server Components.

**How to avoid:** Create an intermediate Client Component file:
```typescript
// VideoPlayerWrapper.tsx
'use client'
import dynamic from 'next/dynamic'
const VideoPlayer = dynamic(() => import('./VideoPlayer').then(m => m.VideoPlayer), { ssr: false })
export { VideoPlayer }
```
Then import `VideoPlayer` from `VideoPlayerWrapper` inside the Server Component page.

**Warning signs:** Player component renders nothing; no error in console; checking React DevTools shows the component tree stops at the dynamic boundary.

### Pitfall 3: Persian VTT RTL Cue Rendering

**What goes wrong:** Persian subtitle text renders left-to-right (broken) or the cue box appears in the wrong position even though the VTT file has `direction:rtl`.

**Why it happens:** Browser VTT cue rendering is controlled by the browser's text track engine, not CSS. The `<html dir="rtl">` attribute does NOT automatically apply to VTT cues. The VTT file must explicitly include `direction:rtl` in the cue settings line:
```vtt
WEBVTT

00:00:01.000 --> 00:00:05.000 direction:rtl
متن فارسی
```

Browser support for VTT cue settings varies. Chrome respects `direction:rtl`; Safari has inconsistencies.

**How to avoid:** Ensure all VTT files use `direction:rtl` cue settings. Test in Chrome (primary), Firefox, and Safari.

**Warning signs:** Subtitle text appears mirrored, or Arabic/Persian text reads LTR (English reading direction).

### Pitfall 4: MongoDB Regex Performance on Large Collections

**What goes wrong:** `$regex` without a case-insensitive prefix index is a full collection scan — O(n) on every search keystroke. On a small dataset (hundreds of videos) this is imperceptible. On a larger dataset it will be slow.

**Why it happens:** Case-insensitive regex (`options: "i"`) cannot use a standard ascending index.

**How to avoid for v1:** The content set is small (curated platform, not UGC). Regex is fine for v1. Add a note in STATE.md that search needs Atlas Search or a text index strategy at scale. If collection size grows, consider a prefix-anchored regex (`^queryterm`) which CAN use a standard index.

**Warning signs:** Search responses taking >200ms with only hundreds of documents — investigate index usage.

### Pitfall 5: Bottom Tab Bar Interfering with Video Player Full-Screen

**What goes wrong:** On mobile, the fixed bottom tab bar overlaps the bottom of the video player or is visible during full-screen playback.

**Why it happens:** CSS `position: fixed` elements remain visible during browser full-screen unless explicitly handled.

**How to avoid:** On the watch page, hide the bottom tab bar (pass a prop or use a CSS class on `body`). Alternatively, only show the bottom tab bar on non-watch routes using pathname detection (same pattern as `LayoutShell` in admin-app).

**Warning signs:** Bottom nav overlapping player controls on mobile; nav visible during full-screen.

### Pitfall 6: HLS Path Convention

**What goes wrong:** The player tries to load `/hls/{episode_id}/master.m3u8` but the file doesn't exist because the episode has not been transcoded yet (status != "ready").

**Why it happens:** The site-api returns all episodes including those with status "pending", "downloading", "transcoding", or "failed". The HLS path is derived by convention (`/hls/{id}/master.m3u8`) — there is no `hls_url` field on the Episode document.

**How to avoid:** In site-api `ListEpisodes`, filter by `status: "ready"` for public endpoints. Only expose episodes that have completed transcoding. The admin panel shows all statuses; the public site should never show unplayable episodes.

```go
// site-api ListEpisodes: always filter by status=ready for public endpoints
filter := bson.D{{Key: "status", Value: "ready"}}
if channelID := r.URL.Query().Get("channel_id"); channelID != "" {
    oid, _ := bson.ObjectIDFromHex(channelID)
    filter = bson.D{{Key: "channel_id", Value: oid}, {Key: "status", Value: "ready"}}
}
```

---

## Code Examples

Verified patterns from official sources and project conventions:

### Video.js Source Type for HLS

```typescript
// Source: https://videojs.org/guides/options/
// type 'application/x-mpegURL' activates VHS (videojs-http-streaming) automatically
sources: [{
  src: '/hls/507f1f77bcf86cd799439011/master.m3u8',
  type: 'application/x-mpegURL'
}]
```

### Video.js Playback Rates Option

```typescript
// Source: https://videojs.org/guides/options/
// Satisfies PLAY-02: 0.75x, 1x, 1.25x, 1.5x behind gear icon
{
  playbackRates: [0.75, 1, 1.25, 1.5],
  controlBar: {
    playbackRateMenuButton: true,
  }
}
```

### Video.js Text Track (Persian Subtitle)

```typescript
// Added via options.tracks array OR player.addTextTrack() after init
// VTT file must include direction:rtl in cue settings for correct RTL rendering
{
  tracks: [{
    src: '/subtitles/episode-id.vtt',
    kind: 'subtitles',
    srclang: 'fa',
    label: 'فارسی',
    default: true,
  }]
}
```

### Video.js Player Dispose (React Cleanup)

```typescript
// Source: https://videojs.org/guides/player-workflows/
// dispose() is the ONLY supported way to remove a Video.js player
useEffect(() => {
  return () => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      playerRef.current.dispose()
      playerRef.current = null
    }
  }
}, [])
```

### Autoplay-Next Countdown Overlay

```typescript
// Custom React approach — simpler than videojs-next-episode plugin
// PLAY-03: 5-10 second countdown then navigate to next episode

function CountdownOverlay({ nextEpisode, onCancel, onProceed }: CountdownProps) {
  const [seconds, setSeconds] = useState(7)

  useEffect(() => {
    if (seconds <= 0) { onProceed(); return }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, onProceed])

  return (
    <div className="absolute inset-0 flex items-end justify-end p-6 bg-black/40">
      <div className="bg-white rounded-2xl p-4 text-center shadow-xl max-w-xs">
        <p className="text-sm text-gray-500 mb-1">قسمت بعدی در {seconds} ثانیه</p>
        <p className="font-bold mb-3">{nextEpisode.title}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 border rounded-lg">لغو</button>
          <button onClick={onProceed} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">
            پخش
          </button>
        </div>
      </div>
    </div>
  )
}
```

### MongoDB Channels Filter by Age Group

```go
// site-api: GET /channels?age_group_id=xxx
// channels.age_group_ids is an array field; $elemMatch or direct equality works
if ageGroupID := r.URL.Query().Get("age_group_id"); ageGroupID != "" {
    oid, err := bson.ObjectIDFromHex(ageGroupID)
    if err == nil {
        // MongoDB matches documents where age_group_ids array contains the given OID
        filter = append(filter, bson.E{Key: "age_group_ids", Value: oid})
    }
}
```

### Tailwind Horizontal Scroll Rail

```typescript
// snap-x mandatory for touch scroll snapping; scrollbar hidden on Webkit
<div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory
               [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
  {items.map(item => (
    <div key={item.id} className="snap-start flex-shrink-0 w-40 sm:w-48 lg:w-56">
      <ThumbnailCard {...item} />
    </div>
  ))}
</div>
```

### docker-compose.yml Addition for site-app

```yaml
# Add to site-app service in docker-compose.yml
environment:
  - SITE_API_INTERNAL_URL=http://site-api:8081
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `videojs-http-streaming` separate package | Bundled in Video.js 8 | Video.js 8.0 (2023) | No separate VHS install; just `import videojs` |
| `tailwind.config.ts` for font/theme | `@theme {}` block in CSS | Tailwind v4 (2024) | Already handled in Phase 1; don't add config file |
| `primitive.ObjectID` | `bson.ObjectID` | mongo-driver v2 | Already decided in Phase 1; no primitive subpackage |
| Next.js `middleware.ts` export | `proxy.ts` with `export function proxy()` | Next.js 16 | Already handled in Phase 2; site-app may or may not need proxy.ts (no auth = no redirect guards) |
| `pages/` directory | `app/` directory (App Router) | Next.js 13+ | Project uses App Router; all pages are Server Components by default |

**Deprecated/outdated:**
- `videojs-contrib-hls`: Replaced by `videojs-http-streaming` (VHS), itself now bundled in Video.js 8. Do not install either separately.
- `primitive.ObjectID` in Go: Removed in mongo-driver v2. Use `bson.ObjectID` directly.
- `tailwind.config.ts` with `fontFamily` override: Replaced by `@theme { --font-sans: ... }` in CSS in Tailwind v4.

---

## Open Questions

1. **Does site-app need a proxy.ts (auth guard)?**
   - What we know: AUTH-04 requires all content viewable without login; there are no protected pages in Phase 3.
   - What's unclear: Phase 4 will add user accounts. Will the login/profile pages be in site-app?
   - Recommendation: Do NOT add proxy.ts in Phase 3. Phase 4 will introduce it when user auth pages exist.

2. **Persian VTT subtitle rendering in Safari**
   - What we know: Chrome respects `direction:rtl` in VTT cue settings; behavior in Safari is inconsistent across OS versions.
   - What's unclear: Whether Safari on iOS correctly right-aligns Arabic/Persian Unicode in VTT cues.
   - Recommendation: Implement with `direction:rtl` in VTT files; add manual browser testing step before phase sign-off. If Safari fails, use a JavaScript VTT parser override (Video.js plugin territory) — but don't build it preemptively.

3. **Featured/trending content selection logic**
   - What we know: BROW-01 requires a "featured/trending" rail; there is no view count field on Episode documents.
   - What's unclear: What determines "featured" — newest episodes? Manual curation? Admin-flagged?
   - Recommendation: For Phase 3, implement "featured" as the N most recently added episodes with `status: "ready"`, sorted by `created_at DESC`. This is deterministic, requires no new data model changes, and can be replaced with explicit curation in a future phase.

4. **site-api docker-compose service configuration**
   - What we know: site-api binary exists in `backend/cmd/site-api/main.go` with just a health endpoint; docker-compose.yml has site-api defined.
   - What's unclear: Current docker-compose.yml service config for site-api — whether PORT env and volume mounts are correct.
   - Recommendation: Check `docker-compose.yml` at Plan 03-01 start; site-api likely needs no HLS_ROOT volume since it's read-only public.

---

## Sources

### Primary (HIGH confidence)
- `https://videojs.org/guides/react/` — Official Video.js React integration pattern with useRef, useEffect, dispose
- `https://videojs.org/guides/player-workflows/` — Official player lifecycle: dispose() is the only supported removal method
- `https://videojs.org/guides/options/` — playbackRates, sources, tracks options reference
- Project codebase: `backend/internal/handler/*.go` — Existing handler pattern (factory functions, chi, mongo-driver v2)
- Project codebase: `admin-app/src/lib/api.ts` — API client pattern (server vs client fetch, Docker DNS)
- Project codebase: `nginx/nginx.conf` — `/api/site/` → `http://site_api/` proxy already configured
- Project codebase: `backend/internal/db/mongo.go` — `channels.category_ids` and `channels.age_group_ids` indexes exist
- Project codebase: `site-app/src/app/layout.tsx` — RTL, Vazirmatn already configured; Phase 3 replaces shell

### Secondary (MEDIUM confidence)
- `https://www.mongodb.com/docs/manual/reference/text-search-languages/` — Persian listed as Enterprise-only for text index; Community users need regex fallback
- `https://tailwindcss.com/docs/scroll-snap-type` — Tailwind snap-x, snap-mandatory utilities for horizontal rails
- Next.js App Router docs — `dynamic(..., { ssr: false })` must be called from a Client Component in App Router

### Tertiary (LOW confidence)
- WebSearch community reports on Safari VTT `direction:rtl` support — inconsistent; needs hands-on validation
- WebSearch on Video.js StrictMode double-init — community-reported behavior; consistent with React docs on StrictMode

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project or locked decisions with official docs
- Architecture: HIGH — directly mirrors existing admin-api/admin-app patterns; no new patterns introduced
- Video.js integration: HIGH — official docs confirm pattern; dispose/lifecycle well-documented
- Persian subtitle RTL: MEDIUM — VTT direction:rtl is standard but Safari behavior unverified; flag for testing
- MongoDB regex search: HIGH — straightforward; regex with QuoteMeta is safe and correct for Unicode
- Autoplay-next countdown: HIGH — custom React overlay; simpler and more controllable than third-party plugins

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack — Video.js 8, Next.js 16, Go chi, Tailwind 4)
