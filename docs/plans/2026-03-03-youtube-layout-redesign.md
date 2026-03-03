# YouTube-Style Layout Redesign for KidTube Site-App

**Date**: 2026-03-03
**Status**: Approved
**Approach**: Full YouTube clone layout with KidTube's claymorphism visual identity

## Overview

Restructure the KidTube site-app from its current top-navbar + horizontal-rails layout to a YouTube-style layout with collapsible left sidebar, responsive video grid homepage, richer video cards, and two-column watch page.

## Design Decisions

- **Visual identity preserved**: Keep claymorphism (clay shadows, warm cream palette, rounded corners, Fredoka/Vazirmatn typography, bouncy hover effects)
- **RTL-first**: All layouts mirror for right-to-left (sidebar on right, text alignment)
- **Mobile preserved**: Bottom tab bar stays on mobile; sidebar is desktop-only (`md:+`)

---

## 1. Global Layout Shell

### Current
- `TopNavbar` (desktop sticky top) + `BottomTabBar` (mobile fixed bottom)
- Full-width content area, no sidebar

### New: 3-Zone Layout

```
┌──────────────────────────────────────────────────────┐
│  Top Bar (sticky, frosted glass)                     │
│  [☰ Toggle]  [KidTube Logo]   [🔍 Search]  [👤 User]│
├────────┬─────────────────────────────────────────────┤
│Sidebar │  Main Content (scrollable)                  │
│ 240px  │                                             │
│expanded│                                             │
│ 72px   │                                             │
│collapsed│                                            │
├────────┴─────────────────────────────────────────────┤
│  Mobile: BottomTabBar (sidebar hidden)               │
└──────────────────────────────────────────────────────┘
```

### Top Bar
- Sticky, frosted glass (`clay-frosted`)
- Right side (RTL): Hamburger toggle + "کیدتیوب" logo (Fredoka font, coral)
- Center: Search input (clay-input style, magnifier icon)
- Left side (RTL): User avatar circle or "ورود" login button

### Sidebar (Desktop only, `md:+`)
- Width: 240px expanded, 72px collapsed (icon-only mode)
- Toggle: hamburger button in top bar
- Background: `var(--color-surface)` with `border-inline-start: var(--clay-border)`
- Navigation items:
  - 🏠 خانه (Home) → `/`
  - 📂 دسته‌بندی‌ها (Browse) → `/browse`
  - ⭐ اشتراک‌ها (Subscriptions) → `/subscriptions`
  - 🔖 نشان‌شده‌ها (Bookmarks) → `/bookmarks`
  - 👤 حساب کاربری (Account) → `/account`
- Active item: coral background tint + bold text
- Hover: `var(--color-primary-hover)` background
- Collapsed mode: only icons visible, tooltip on hover
- Transition: smooth width animation with `var(--clay-bounce)` easing

### Mobile (`< md`)
- Sidebar completely hidden
- `BottomTabBar` remains (Home, Browse, Search)
- Top bar simplified: logo + avatar only (search moves to bottom tab)

### Components Affected
- **Remove**: `TopNavbar` → replace with `TopBar`
- **New**: `Sidebar` component
- **Modify**: `layout.tsx` root layout to use new shell
- **Keep**: `BottomTabBar` (mobile), `ProfileDropdown` (moves to top bar avatar)

---

## 2. Homepage — Responsive Video Grid

### Current
- `AgeFilterTabs` + multiple `HorizontalRail` components per category
- Each rail scrolls horizontally with 180px fixed-width cards

### New: Category Chips + Video Grid

```
[Category Chips: همه | کارتون | آموزشی | موسیقی | ...]
[──────────────────────────────────────────────────────]
[Card] [Card] [Card] [Card] [Card]
[Card] [Card] [Card] [Card] [Card]
[Card] [Card] [Card] [Card] [Card]
...
```

### Category Chips
- Reuse/adapt `AgeFilterTabs` component → rename to `CategoryChips`
- Chips now filter by category instead of age group
- "همه" (All) shows mixed feed from all categories
- Sticky below top bar on scroll
- Same clay pill styling (active: coral fill, inactive: surface bg)

### Video Grid
- CSS Grid: responsive columns
  - 1 col: `< sm` (mobile)
  - 2 cols: `sm` (≥640px)
  - 3 cols: `md` (≥768px)
  - 4 cols: `lg` (≥1024px)
  - 5 cols: `xl` (≥1280px)
- Gap: `gap-4` (16px)
- Max width: `max-w-[1800px]` centered
- Content: mixed feed of latest episodes; filtered when chip selected

### Data Fetching
- Default: fetch latest/featured episodes across all categories
- Chip selected: fetch episodes filtered by `category_id`
- Pagination: infinite scroll or "load more" button

### Components Affected
- **Remove**: `HorizontalRail` (from homepage usage — may keep for other pages)
- **Rename/Adapt**: `AgeFilterTabs` → `CategoryChips`
- **New**: Homepage grid layout in `page.tsx`
- **Modify**: `ThumbnailCard` → new rich card (see Section 3)

---

## 3. Rich Video Card

### Current
- 180px fixed width, clay card
- Thumbnail (aspect-video) + title only
- Pastel placeholder if no thumbnail

### New: YouTube-Style Rich Card

```
┌─────────────────────────────────┐
│                                 │
│         Thumbnail (16:9)        │  ← rounded-[20px] top corners
│                    ┌──────┐     │
│                    │۱۲:۳۴│     │  ← Duration badge
│                    └──────┘     │
├─────────────────────────────────┤
│ 🔵  عنوان قسمت (حداکثر ۲ خط)   │  ← 40px channel avatar + bold title
│     نام کانال                   │  ← Muted, clickable channel link
│     قسمت ۵                      │  ← Episode number, muted
└─────────────────────────────────┘
```

### Thumbnail Area
- Full width, `aspect-video` (16:9)
- Rounded top: `rounded-t-[var(--clay-radius)]`
- Image or pastel placeholder with letter (keep existing behavior)
- **Duration badge**: Absolute positioned bottom-left (RTL: bottom-right)
  - Dark semi-transparent bg (`rgba(0,0,0,0.8)`), white text
  - Persian digits, small rounded pill
  - Font: Vazirmatn, 12px

### Info Area (below thumbnail)
- Padding: `p-3`
- Layout: flex row (RTL)
  - Right: Channel avatar (40px circle, link to channel)
  - Left: Text stack
    - **Title**: Vazirmatn bold, `text-sm`, `line-clamp-2`, `var(--color-text)`
    - **Channel name**: `text-xs`, `var(--color-text-muted)`, link to `/channel/[id]`
    - **Episode number**: `text-xs`, `var(--color-text-faint)`

### Card Styling
- No outer border (cleaner like YouTube)
- Subtle clay shadow on hover only (`var(--clay-shadow-hover)`)
- Hover: lift `-translate-y-[2px]`, shadow appears
- Active: press effect `translate-y-[1px] scale-[0.98]`
- Rounded: `rounded-[var(--clay-radius)]` on entire card
- Background: transparent (no surface bg — just thumbnail + text)

### Components Affected
- **Major rewrite**: `ThumbnailCard` component
- Card now needs `channel` data (name, thumbnail/avatar, id) in addition to episode data

---

## 4. Watch Page — Two-Column Layout

### Current
- Single column centered (`max-w-4xl`)
- Video → action buttons → info card → episodes grid below

### New: Video + Sidebar Recommendations

```
Desktop (lg:+):
┌──────────────────────────────────┬──────────────────┐
│       Video Player               │ Other Episodes   │
│       (rounded, clay border)     │                  │
├──────────────────────────────────┤ ┌──────────────┐ │
│ [Subscribe]        [Bookmark]    │ │[Thumb][Title]│ │
├──────────────────────────────────┤ │      [Chan.] │ │
│ Episode Title (Fredoka, large)   │ └──────────────┘ │
│ Episode # badge (sky blue pill)  │ ┌──────────────┐ │
│ ─────────────────────────        │ │[Thumb][Title]│ │
│ 🔵 Channel Name (avatar + link) │ │      [Chan.] │ │
│ ─────────────────────────        │ └──────────────┘ │
│ Description (expandable)         │       ...        │
└──────────────────────────────────┴──────────────────┘

Mobile (< lg):
┌──────────────────────────────────┐
│       Video Player               │
├──────────────────────────────────┤
│ [Subscribe]        [Bookmark]    │
├──────────────────────────────────┤
│ Episode Info                     │
├──────────────────────────────────┤
│ Other Episodes (stacked cards)   │
└──────────────────────────────────┘
```

### Desktop Layout (`lg:+`)
- Container: `max-w-[1400px]` with `flex` row
- Video column: `flex-1` (~65% width)
- Sidebar: `w-[400px]` fixed width, scrollable independently

### Recommendation Sidebar
- Heading: "قسمت‌های دیگر از {channel}" (same as current)
- **Mini horizontal cards**:
  - Thumbnail on right (RTL): 168px wide, aspect-video, rounded
  - Info on left: title (1-2 lines), channel name, episode number
  - Gap between cards: `gap-2`
  - Hover: subtle lift

### Mobile Layout (`< lg`)
- Single column, full width
- Same order: video → buttons → info → episodes list
- Episodes shown as mini horizontal cards (same as sidebar)

### Components Affected
- **Major rewrite**: `watch/[id]/page.tsx` and `WatchClient.tsx`
- **New**: `MiniCard` component for sidebar/mobile recommendations
- **Keep**: `VideoPlayer`, `CountdownOverlay`, `SubscribeButton`, `BookmarkButton`

---

## 5. Search Page Updates

### Current
- Full-page overlay with frosted top bar

### New
- Search integrated into top bar (desktop)
- Search results page uses same grid layout as homepage
- Results grouped: "کانال‌ها" section (channel cards) + "قسمت‌ها" section (episode cards in grid)

---

## 6. Browse Page Updates

### Current
- Grid of category tiles (colored rectangles)

### New
- Keep existing category tile grid (works well)
- Category detail pages use new video grid instead of old card grid

---

## Component Summary

| Component | Action | Notes |
|---|---|---|
| `TopNavbar` | Replace → `TopBar` | Search integrated, hamburger toggle |
| `Sidebar` | New | Collapsible left sidebar, desktop only |
| `BottomTabBar` | Keep | Mobile navigation unchanged |
| `ProfileDropdown` | Modify | Moves to top bar avatar |
| `HorizontalRail` | Remove from homepage | May keep for other uses |
| `AgeFilterTabs` | Rename → `CategoryChips` | Filter by category not age |
| `ThumbnailCard` | Major rewrite | Rich card with avatar, metadata |
| `MiniCard` | New | Horizontal card for watch page sidebar |
| `layout.tsx` | Major rewrite | New 3-zone shell layout |
| `page.tsx` (home) | Major rewrite | Grid layout + category filter |
| `watch/[id]/*` | Major rewrite | Two-column layout |
| `search/page.tsx` | Modify | Use grid, remove overlay style |

---

## Sources

Design research based on:
- [YouTube Blog — Fresh new look for YouTube](https://blog.youtube/news-and-events/introducing-fresh-new-look-for-youtube/)
- [YouTube Major Video UI Update — Design Compass](https://designcompass.org/en/2025/10/15/youtube-major-video-ui-update/)
- [YouTube Material Design 3 Makeover — Android Police](https://www.androidpolice.com/youtube-testing-modern-desktop-redesign/)
- [YouTube New Desktop Design — Android Police](https://www.androidpolice.com/youtube-new-desktop-design-nobody-likes/)
