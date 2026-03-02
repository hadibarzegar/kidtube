# Site-App Claymorphism Redesign

**Date:** 2026-03-02
**Scope:** Full redesign of all 13 components + 12 pages in site-app
**Approach:** Theme-First (Bottom-Up) — tokens first, then components, then pages

## Design System

**Style:** Claymorphism (soft 3D, toy-like, bubbly)
**Colors:** Warm Pastels
**Typography:** Vazirmatn (Persian) + Fredoka (headings) + Nunito (body)
**Reference:** `design-system/kidtube/MASTER.md`

## Decisions

- **Logo:** Text-only "کیدتیوب" with playful coral styling (no icon)
- **Video player:** Dark player area, clay surroundings
- **Placeholders:** Rotating pastels (6 colors cycling by index)
- **No dark mode** — bright and warm for children

## Section 1: Foundation (globals.css + fonts + Tailwind)

Replace all `:root` CSS variables with warm pastel palette:

```
--color-bg: #FFF8F3        (warm white background)
--color-surface: #FFFAF5   (cream card surfaces)
--color-primary: #FF8A7A   (soft coral)
--color-primary-light: #FFD4CC
--color-secondary: #7EC8E3 (baby blue)
--color-secondary-light: #D4EFFA
--color-mint: #7ED6A8      (accent green)
--color-lilac: #C4A8E0     (accent purple)
--color-yellow: #FFD166    (accent yellow)
--color-text: #2D2D3A      (dark charcoal)
--color-text-muted: #6B6B80
--color-border: #E8DFD6    (soft border)
--color-error: #FF6B6B     (soft red)
```

Add Fredoka + Nunito via Google Fonts import. Update `@theme` font families. Add reusable clay utility classes (`.clay-card`, `.clay-btn`, `.clay-input`). Update Video.js big play button from blue to coral.

## Section 2: Layout

### Root Layout
- `bg-white` → `bg-[#FFF8F3]`
- Add Fredoka + Nunito font variables

### TopNavbar
- Frosted glass: `rgba(255,248,243,0.9)` + `backdrop-filter: blur(10px)`
- Border: `3px solid #E8DFD6`, soft outer shadow
- Logo: coral color, subtle text-shadow
- Nav links: `#2D2D3A` default, hover → coral
- Login button: `rounded-2xl`, 3px coral border, clay shadow
- Avatar: coral bg, clay shadow

### BottomTabBar
- Frosted glass background with backdrop-blur
- Border-top: `3px solid #E8DFD6`
- Active: coral text + `#FFD4CC` pill bg with 12px radius
- Inactive: `#6B6B80`

## Section 3: Shared Components

### ThumbnailCard
- `rounded-[20px]`, `3px solid #E8DFD6`, double shadow (inner + outer)
- Hover: `translateY(-3px)` with bounce easing, border → coral, stronger shadow
- Active: `translateY(1px) scale(0.97)` tactile press
- Background: cream (`#FFFAF5`)
- Placeholders: rotating pastels (index % 6) — peach, baby blue, mint, lilac, yellow, soft pink
- Remove layout-shifting `hover:scale` — use translateY only

### HorizontalRail
- Title: `#2D2D3A`, "View All" link: coral
- Subtle bottom divider: `1px solid #E8DFD6`

### AgeFilterTabs
- Active: coral bg, white text, `3px solid #E57A6A`, clay shadow
- Inactive: cream bg, `3px solid #E8DFD6`, `#2D2D3A` text
- `rounded-2xl` instead of `rounded-full`

### SearchOverlay
- Page bg: `#FFF8F3`
- Input: cream bg, 3px clay border, focus → baby blue border
- Spinner: coral. Sticky bar: frosted glass + thick bottom border

## Section 4: Interactive Components

### BookmarkButton
- Default: `#6B6B80` icon, cream bg, clay border, `rounded-2xl`
- Bookmarked: coral icon (filled), light coral bg + border
- Hover: clay shadow + bounce lift. Press: scale(0.95)

### SubscribeButton
- Not subscribed: coral bg, white text, `3px solid #E57A6A`, clay shadow
- Subscribed: cream bg, `#6B6B80` text, clay border
- `rounded-2xl` instead of `rounded-full`

### CountdownOverlay
- Backdrop stays `bg-black/50`
- Card: cream bg, clay border + shadow, `rounded-[20px]`
- Play button: coral. Cancel: cream with clay border

### ProfileDropdown
- Avatar: coral bg, clay shadow
- Dropdown: cream bg, clay border, `rounded-[20px]`
- Item hover: `#FFF0EB`. Logout hover: `#FFF0F0`

## Section 5: Pages

### Home (`/`)
- `bg-[#FFF8F3]`. Empty state: coral-tinted text. Component changes cascade.

### Browse (`/browse`)
- Category cards: rotating pastel bgs, clay treatment

### Channel (`/channel/[id]`)
- Hero: keep gradient overlay, pastel fallback. Back button: coral.
- Description border: thick clay. Not-found: clay card.

### Watch (`/watch/[id]`)
- Player: **stays dark**. Wrapper: `rounded-[20px]` with clay border.
- Episode info: cream clay card. Video.js play button: coral.

### Login + Register
- Page bg: `#FFF8F3`. Form card: clay treatment.
- Inputs: clay-styled. Submit: coral. Links: coral.

### Search (`/search`)
- Picks up SearchOverlay component changes.

### Subscriptions + Bookmarks
- Bg: `#FFF8F3`. Empty states: coral text. Grid: component cascade.

### Account
- ChangePasswordForm: clay card. Inputs + buttons: clay-styled.
- Success: mint (`#7ED6A8`). Error: soft red (`#FF6B6B`).

## Implementation Order (Theme-First)

1. `globals.css` — tokens, font imports, clay utilities, Video.js overrides
2. `layout.tsx` — bg color, font variables
3. `TopNavbar` + `BottomTabBar` — navigation chrome
4. `ThumbnailCard` + `HorizontalRail` + `AgeFilterTabs` — core shared components
5. `SearchOverlay` + `BookmarkButton` + `SubscribeButton` + `CountdownOverlay` + `ProfileDropdown` — interactive components
6. Pages: Home → Browse → Channel → Watch → Login → Register → Search → Subscriptions → Bookmarks → Account
7. `ChangePasswordForm` (account subcomponent)

## Claymorphism Checklist (per component)

- [ ] `border-radius: 16-24px` (20px default)
- [ ] `border: 3px solid` (clay border color)
- [ ] Double shadow: inner inset + outer
- [ ] Bounce easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- [ ] `cursor-pointer` on all clickable elements
- [ ] Transitions: 200ms
- [ ] Warm pastel palette used (no raw blue/gray)
- [ ] `prefers-reduced-motion` respected
