# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** KidTube
**Generated:** 2026-03-02
**Category:** Kids Video Streaming / Education Entertainment
**Language:** Farsi (RTL) primary, with Latin fallback

---

## Visual Style: Claymorphism

**Keywords:** Soft 3D, chunky, playful, toy-like, bubbly, thick borders, double shadows, rounded
**Best For:** Children's apps, educational apps, SaaS platforms, creative tools, fun-focused, casual games
**Performance:** Good | **Accessibility:** Ensure 4.5:1 contrast

### Key Design Traits
- **Border radius:** 16-24px (cards, buttons, containers)
- **Borders:** 3-4px solid, slightly darker than background
- **Shadows:** Double — inner shadow (inset) + outer shadow for 3D depth
- **Animations:** Soft bounce on hover/press (cubic-bezier(0.34, 1.56, 0.64, 1))
- **Overall feel:** Like touching soft clay or toy blocks

### CSS Design Variables
```css
--clay-border-radius: 20px;
--clay-border-width: 3px;
--clay-shadow-inner: inset -2px -2px 6px rgba(0,0,0,0.06);
--clay-shadow-outer: 4px 4px 10px rgba(0,0,0,0.08);
--clay-shadow-hover: 6px 6px 14px rgba(0,0,0,0.12);
--clay-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--clay-transition: all 200ms var(--clay-bounce);
```

---

## Color Palette: Warm Pastels

| Role | Name | Hex | CSS Variable | Usage |
|------|------|-----|--------------|-------|
| Background | Warm White | `#FFF8F3` | `--color-bg` | Page backgrounds |
| Surface | Cream | `#FFFAF5` | `--color-surface` | Card backgrounds |
| Primary | Soft Coral | `#FF8A7A` | `--color-primary` | Primary actions, active states |
| Primary Light | Light Coral | `#FFD4CC` | `--color-primary-light` | Hover backgrounds, badges |
| Secondary | Baby Blue | `#7EC8E3` | `--color-secondary` | Secondary actions, links |
| Secondary Light | Light Blue | `#D4EFFA` | `--color-secondary-light` | Info backgrounds |
| Accent 1 | Mint Green | `#7ED6A8` | `--color-mint` | Success, categories |
| Accent 2 | Soft Lilac | `#C4A8E0` | `--color-lilac` | Tags, highlights |
| Accent 3 | Warm Yellow | `#FFD166` | `--color-yellow` | Badges, ratings, warnings |
| Text Primary | Dark Charcoal | `#2D2D3A` | `--color-text` | Headings, body text |
| Text Secondary | Warm Gray | `#6B6B80` | `--color-text-muted` | Subtitles, metadata |
| Text Tertiary | Light Gray | `#9B9BAD` | `--color-text-faint` | Placeholders |
| Border | Soft Border | `#E8DFD6` | `--color-border` | Card borders, dividers |
| Error | Soft Red | `#FF6B6B` | `--color-error` | Error states |

**Category Card Colors** (rotating):
- Peach: `#FDBCB4`
- Baby Blue: `#ADD8E6`
- Mint: `#98FF98`
- Lilac: `#E6E6FA`
- Warm Yellow: `#FFE4A0`
- Soft Pink: `#FFB3D9`

---

## Typography

### Persian Text (Primary)
- **Font:** Vazirmatn
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
- **CSS Variable:** `--font-vazirmatn`
- **Usage:** All Persian content, body text, UI labels

### Latin Display Text
- **Heading Font:** Fredoka
- **Body Font:** Nunito
- **Mood:** Playful, friendly, fun, creative, warm, approachable
- **Best For:** Children's apps, educational, gaming, creative tools

**Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
```

**Tailwind Config:**
```js
fontFamily: {
  sans: ['Vazirmatn', 'Nunito', 'sans-serif'],
  display: ['Fredoka', 'Vazirmatn', 'sans-serif'],
  body: ['Vazirmatn', 'Nunito', 'sans-serif'],
}
```

### Typography Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Title | 2rem (32px) | 700 (Bold) | 1.3 |
| Section Title | 1.25rem (20px) | 700 (Bold) | 1.4 |
| Card Title | 1rem (16px) | 600 (SemiBold) | 1.4 |
| Body Text | 0.9375rem (15px) | 400 (Regular) | 1.6 |
| Caption | 0.8125rem (13px) | 400 (Regular) | 1.5 |
| Small | 0.75rem (12px) | 500 (Medium) | 1.4 |

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

---

## Component Specs

### Buttons (Claymorphism)

```css
/* Primary Button */
.btn-primary {
  background: #FF8A7A;
  color: white;
  padding: 12px 24px;
  border-radius: 16px;
  border: 3px solid #E57A6A;
  font-weight: 600;
  box-shadow: inset -2px -2px 4px rgba(0,0,0,0.06), 4px 4px 8px rgba(0,0,0,0.08);
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: inset -2px -2px 4px rgba(0,0,0,0.06), 6px 6px 12px rgba(0,0,0,0.12);
}

.btn-primary:active {
  transform: translateY(1px) scale(0.97);
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.1), 2px 2px 4px rgba(0,0,0,0.05);
}

/* Secondary Button */
.btn-secondary {
  background: #FFFAF5;
  color: #2D2D3A;
  padding: 12px 24px;
  border-radius: 16px;
  border: 3px solid #E8DFD6;
  font-weight: 600;
  box-shadow: inset -2px -2px 4px rgba(0,0,0,0.04), 3px 3px 6px rgba(0,0,0,0.06);
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
```

### Cards (Claymorphism)

```css
.card {
  background: #FFFAF5;
  border-radius: 20px;
  border: 3px solid #E8DFD6;
  padding: 16px;
  box-shadow: inset -2px -2px 6px rgba(0,0,0,0.04), 4px 4px 10px rgba(0,0,0,0.08);
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: inset -2px -2px 6px rgba(0,0,0,0.04), 6px 8px 16px rgba(0,0,0,0.12);
  border-color: #FF8A7A;
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 3px solid #E8DFD6;
  border-radius: 16px;
  font-size: 16px;
  background: #FFFAF5;
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.04);
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #7EC8E3;
  outline: none;
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.04), 0 0 0 3px rgba(126,200,227,0.2);
}
```

### Navigation

```css
/* Bottom tab item (mobile) */
.tab-active {
  color: #FF8A7A;
  background: #FFD4CC;
  border-radius: 12px;
  padding: 8px 16px;
}

/* Top navbar */
.navbar {
  background: rgba(255,248,243,0.9);
  backdrop-filter: blur(10px);
  border-bottom: 3px solid #E8DFD6;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
```

---

## Animation Guidelines

### Micro-interactions
- **Duration:** 150-300ms for hover/press
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (soft bounce)
- **Hover lift:** `translateY(-2px)` to `translateY(-4px)`
- **Active press:** `translateY(1px) scale(0.97)`

### Page Transitions
- **Stagger delay:** 50ms between items in grids
- **Entry animation:** Fade up from 20px below
- **Duration:** 300-400ms

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Layout

### Grid System
- **Mobile (< 640px):** 2 columns, gap-3
- **Tablet (640-1024px):** 3-4 columns, gap-4
- **Desktop (> 1024px):** 4-5 columns, gap-4
- **Max width:** `max-w-7xl` (1280px)

### Navigation
- **Mobile:** Bottom tab bar (3 tabs: Home, Browse, Search)
- **Desktop:** Top navbar with search, profile dropdown
- **RTL:** `dir="rtl"` on html, icons flip appropriately

---

## Anti-Patterns (Do NOT Use)

- **No emojis as icons** — Use SVG icons (Lucide or Heroicons)
- **No missing cursor:pointer** — All clickable elements must have it
- **No layout-shifting hovers** — Avoid scale transforms that shift surrounding content
- **No low contrast text** — 4.5:1 minimum ratio
- **No instant state changes** — Always use transitions (150-300ms)
- **No invisible focus states** — Focus rings must be visible
- **No dark mode** — This app targets children; keep it bright and warm
- **No sharp/square corners** — Everything should feel rounded and soft
- **No harsh colors** — Stay within the warm pastel palette
- **No complex/cluttered layouts** — Keep it simple, children-friendly

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent set (Lucide recommended)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth bounce transitions (200ms)
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Claymorphism applied: thick borders, double shadows, rounded 16-24px
- [ ] Warm pastel palette used consistently
- [ ] RTL layout works correctly
