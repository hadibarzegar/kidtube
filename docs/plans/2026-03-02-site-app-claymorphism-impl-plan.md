# Site-App Claymorphism Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply Claymorphism design system (warm pastels, soft 3D, toy-like) to all 13 components and 12 pages in site-app.

**Architecture:** Pure visual redesign — no logic changes, no new dependencies except Google Fonts. All changes are Tailwind class swaps and CSS variable updates. Theme-First (Bottom-Up) approach: tokens → layout → components → pages.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (@tailwindcss/postcss), Vazirmatn + Fredoka + Nunito fonts

**Design Reference:** `design-system/kidtube/MASTER.md`

---

### Task 1: Foundation — Design Tokens, Fonts, Layout

Update the CSS variables, font setup, and root layout to establish the Claymorphism foundation.

**Files:**
- Modify: `site-app/src/lib/fonts.ts`
- Modify: `site-app/src/app/globals.css`
- Modify: `site-app/src/app/layout.tsx`

**Step 1: Add Fredoka and Nunito fonts**

Edit `site-app/src/lib/fonts.ts` — add Google font imports alongside Vazirmatn:

```typescript
import localFont from 'next/font/local';
import { Fredoka, Nunito } from 'next/font/google';

export const vazirmatn = localFont({
  src: [
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-fredoka',
});

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-nunito',
});
```

**Step 2: Rewrite globals.css with Claymorphism tokens**

Replace entire `site-app/src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-vazirmatn), var(--font-nunito), "Nunito", system-ui, sans-serif;
  --font-display: var(--font-fredoka), var(--font-vazirmatn), "Fredoka", system-ui, sans-serif;
}

:root {
  /* Warm Pastel Palette */
  --color-bg: #FFF8F3;
  --color-surface: #FFFAF5;
  --color-primary: #FF8A7A;
  --color-primary-dark: #E57A6A;
  --color-primary-light: #FFD4CC;
  --color-primary-hover: #FFF0EB;
  --color-secondary: #7EC8E3;
  --color-secondary-light: #D4EFFA;
  --color-mint: #7ED6A8;
  --color-lilac: #C4A8E0;
  --color-yellow: #FFD166;
  --color-text: #2D2D3A;
  --color-text-muted: #6B6B80;
  --color-text-faint: #9B9BAD;
  --color-border: #E8DFD6;
  --color-error: #FF6B6B;

  /* Claymorphism Tokens */
  --clay-radius: 20px;
  --clay-radius-sm: 16px;
  --clay-radius-xs: 12px;
  --clay-border: 3px solid var(--color-border);
  --clay-shadow: inset -2px -2px 6px rgba(0,0,0,0.04), 4px 4px 10px rgba(0,0,0,0.08);
  --clay-shadow-hover: inset -2px -2px 6px rgba(0,0,0,0.04), 6px 8px 16px rgba(0,0,0,0.12);
  --clay-shadow-press: inset 2px 2px 4px rgba(0,0,0,0.1), 2px 2px 4px rgba(0,0,0,0.05);
  --clay-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Category Pastel Rotation */
  --pastel-peach: #FDBCB4;
  --pastel-blue: #ADD8E6;
  --pastel-mint: #98FF98;
  --pastel-lilac: #E6E6FA;
  --pastel-yellow: #FFE4A0;
  --pastel-pink: #FFB3D9;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}

/* Scrollbar hiding utility */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Claymorphism utility classes */
.clay-card {
  background: var(--color-surface);
  border-radius: var(--clay-radius);
  border: var(--clay-border);
  box-shadow: var(--clay-shadow);
  transition: all 200ms var(--clay-bounce);
}

.clay-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--clay-shadow-hover);
  border-color: var(--color-primary);
}

.clay-card:active {
  transform: translateY(1px) scale(0.97);
  box-shadow: var(--clay-shadow-press);
}

.clay-btn {
  border-radius: var(--clay-radius-sm);
  border: 3px solid;
  box-shadow: var(--clay-shadow);
  transition: all 200ms var(--clay-bounce);
  cursor: pointer;
}

.clay-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--clay-shadow-hover);
}

.clay-btn:active {
  transform: translateY(1px) scale(0.97);
  box-shadow: var(--clay-shadow-press);
}

.clay-input {
  background: var(--color-surface);
  border-radius: var(--clay-radius-sm);
  border: 3px solid var(--color-border);
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.04);
  transition: border-color 200ms ease;
}

.clay-input:focus {
  border-color: var(--color-secondary);
  outline: none;
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.04), 0 0 0 3px rgba(126,200,227,0.2);
}

/* Frosted glass navbar */
.clay-frosted {
  background: rgba(255, 248, 243, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .clay-card,
  .clay-card:hover,
  .clay-card:active,
  .clay-btn,
  .clay-btn:hover,
  .clay-btn:active {
    transition: none;
    transform: none;
  }
}

/* Video.js kid-friendly overrides — large controls, high contrast */
.video-js .vjs-big-play-button {
  font-size: 4em;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  line-height: 80px;
  border: none;
  background-color: rgba(255, 138, 122, 0.85);
}
.video-js .vjs-big-play-button:hover {
  background-color: rgba(255, 138, 122, 1);
}
.video-js .vjs-control-bar {
  font-size: 1.2em;
  height: 4em;
  background: rgba(0, 0, 0, 0.7);
}
.video-js .vjs-progress-control {
  height: 0.8em;
}

/* Make seek bar thumb larger for kids */
.video-js .vjs-play-progress:before {
  font-size: 1.4em;
  top: -0.35em;
}

/* Speed control button styling */
.video-js .vjs-playback-rate .vjs-playback-rate-value {
  font-size: 1.1em;
}
```

**Step 3: Update root layout with new fonts and background**

Edit `site-app/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { vazirmatn, fredoka, nunito } from '@/lib/fonts';
import TopNavbar from '@/components/TopNavbar';
import BottomTabBar from '@/components/BottomTabBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'کیدتیوب',
  description: 'ویدیوهای آموزشی فارسی برای کودکان',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${fredoka.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased bg-[var(--color-bg)]">
        <div className="min-h-screen">
          <TopNavbar />
          <main className="pb-20 md:pb-0">
            {children}
          </main>
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
```

**Step 4: Verify build compiles**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (or at minimum no TypeScript errors from our changes)

**Step 5: Commit**

```bash
git add site-app/src/lib/fonts.ts site-app/src/app/globals.css site-app/src/app/layout.tsx
git commit -m "style: add Claymorphism foundation — tokens, fonts, clay utilities"
```

---

### Task 2: Navigation Chrome — TopNavbar + BottomTabBar

**Files:**
- Modify: `site-app/src/components/TopNavbar.tsx`
- Modify: `site-app/src/components/BottomTabBar.tsx`

**Step 1: Restyle TopNavbar**

Replace entire `site-app/src/components/TopNavbar.tsx`:

```tsx
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import ProfileDropdown from '@/components/ProfileDropdown'
import type { SiteUser } from '@/lib/types'

export default async function TopNavbar() {
  const user = await getCurrentUser()

  let userEmail: string | null = null
  if (user) {
    const token = await getSiteSession()
    if (token) {
      const meRes = await apiServerAuthFetch('/me', token)
      if (meRes.ok) {
        const me: SiteUser = await meRes.json()
        userEmail = me.email
      }
    }
  }

  return (
    <header className="hidden md:flex items-center clay-frosted border-b-[3px] border-[var(--color-border)] px-6 py-3 sticky top-0 z-40 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-7xl w-full flex items-center justify-between">
        {/* Logo — right side in RTL */}
        <Link href="/" className="font-display text-2xl font-bold text-[var(--color-primary)] no-underline" style={{ textShadow: '2px 2px 0px rgba(255,138,122,0.15)' }}>
          کیدتیوب
        </Link>

        {/* Navigation links — left side in RTL */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors no-underline"
          >
            خانه
          </Link>
          <Link
            href="/browse"
            className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors no-underline"
          >
            دسته‌بندی‌ها
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors no-underline"
          >
            جستجو
          </Link>

          {/* Auth state */}
          {user && userEmail ? (
            <ProfileDropdown email={userEmail} />
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-primary)] border-[3px] border-[var(--color-primary)] rounded-2xl px-4 min-h-[40px] flex items-center no-underline transition-all duration-200 hover:bg-[var(--color-primary-hover)] shadow-[var(--clay-shadow)]"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

**Step 2: Restyle BottomTabBar**

Replace entire `site-app/src/components/BottomTabBar.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'

const tabs = [
  {
    label: 'خانه',
    href: '/',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'دسته‌بندی',
    href: '/browse',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'جستجو',
    href: '/search',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
]

export default function BottomTabBar() {
  const pathname = usePathname()

  // Hide the bottom tab bar on watch pages to avoid overlapping player controls
  if (pathname.startsWith('/watch/')) return null

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 clay-frosted border-t-[3px] border-[var(--color-border)] md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={[
                'flex flex-col items-center justify-center flex-1 min-h-[60px] gap-1 text-xs font-medium transition-colors duration-200',
                active
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {active ? (
                <span className="bg-[var(--color-primary-light)] rounded-xl px-4 py-1.5 flex items-center justify-center">
                  {tab.icon}
                </span>
              ) : (
                tab.icon
              )}
              <span>{tab.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 3: Commit**

```bash
git add site-app/src/components/TopNavbar.tsx site-app/src/components/BottomTabBar.tsx
git commit -m "style: apply Claymorphism to TopNavbar and BottomTabBar"
```

---

### Task 3: Core Shared Components — ThumbnailCard, HorizontalRail, AgeFilterTabs

**Files:**
- Modify: `site-app/src/components/ThumbnailCard.tsx`
- Modify: `site-app/src/components/HorizontalRail.tsx`
- Modify: `site-app/src/components/AgeFilterTabs.tsx`

**Step 1: Restyle ThumbnailCard with clay treatment and rotating pastels**

Replace entire `site-app/src/components/ThumbnailCard.tsx`:

```tsx
import Image from 'next/image'

const pastelColors = [
  'bg-[#FDBCB4]', // peach
  'bg-[#ADD8E6]', // baby blue
  'bg-[#98FF98]', // mint
  'bg-[#E6E6FA]', // lilac
  'bg-[#FFE4A0]', // yellow
  'bg-[#FFB3D9]', // pink
]

interface ThumbnailCardProps {
  title: string
  thumbnail?: string
  href: string
  subtitle?: string
  index?: number
}

export default function ThumbnailCard({ title, thumbnail, href, subtitle, index = 0 }: ThumbnailCardProps) {
  const pastelBg = pastelColors[index % pastelColors.length]

  return (
    <a
      href={href}
      className="block min-w-[140px] min-h-[60px] snap-start flex-shrink-0 w-[180px] no-underline group"
    >
      <div className="rounded-[20px] overflow-hidden border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),4px_4px_10px_rgba(0,0,0,0.08)] transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[3px] group-hover:shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),6px_8px_16px_rgba(0,0,0,0.12)] group-hover:border-[var(--color-primary)] group-active:translate-y-[1px] group-active:scale-[0.97] cursor-pointer">
        <div className="aspect-video relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="180px"
            />
          ) : (
            <div className={`w-full h-full ${pastelBg} flex items-center justify-center`}>
              <span className="text-white text-3xl font-bold opacity-70 drop-shadow-sm">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="px-2.5 pb-2.5 pt-2">
          <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug">{title}</p>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>
    </a>
  )
}
```

**Step 2: Restyle HorizontalRail**

Replace entire `site-app/src/components/HorizontalRail.tsx`:

```tsx
import React from 'react'

interface HorizontalRailProps {
  title: string
  children: React.ReactNode
  viewAllHref?: string
}

export default function HorizontalRail({ title, children, viewAllHref }: HorizontalRailProps) {
  return (
    <section className="py-4 border-b border-[var(--color-border)] last:border-b-0">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            مشاهده همه
          </a>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory scrollbar-hide [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
    </section>
  )
}
```

**Step 3: Restyle AgeFilterTabs**

Replace entire `site-app/src/components/AgeFilterTabs.tsx`:

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface AgeGroup {
  id: string
  name: string
  min_age: number
  max_age: number
  created_at: string
  updated_at: string
}

interface AgeFilterTabsProps {
  ageGroups: AgeGroup[]
  selectedId: string | null
}

export default function AgeFilterTabs({ ageGroups, selectedId }: AgeFilterTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === null) {
      params.delete('age_group_id')
    } else {
      params.set('age_group_id', id)
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  const tabs = [
    { id: null, label: 'همه' },
    ...ageGroups.map((ag) => ({ id: ag.id, label: ag.name })),
  ]

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide [-webkit-overflow-scrolling:touch]">
      {tabs.map((tab) => {
        const isActive = tab.id === selectedId
        return (
          <button
            key={tab.id ?? 'all'}
            onClick={() => handleSelect(tab.id)}
            className={[
              'min-h-[48px] px-5 rounded-2xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer border-[3px]',
              isActive
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary-light)] hover:bg-[var(--color-primary-hover)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add site-app/src/components/ThumbnailCard.tsx site-app/src/components/HorizontalRail.tsx site-app/src/components/AgeFilterTabs.tsx
git commit -m "style: apply Claymorphism to ThumbnailCard, HorizontalRail, AgeFilterTabs"
```

---

### Task 4: Interactive Components — SearchOverlay, BookmarkButton, SubscribeButton, CountdownOverlay, ProfileDropdown

**Files:**
- Modify: `site-app/src/components/SearchOverlay.tsx`
- Modify: `site-app/src/components/BookmarkButton.tsx`
- Modify: `site-app/src/components/SubscribeButton.tsx`
- Modify: `site-app/src/components/CountdownOverlay.tsx`
- Modify: `site-app/src/components/ProfileDropdown.tsx`

**Step 1: Restyle SearchOverlay**

Replace entire `site-app/src/components/SearchOverlay.tsx`:

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import ThumbnailCard from '@/components/ThumbnailCard'

interface Channel {
  id: string
  name: string
  description: string
  thumbnail: string
  category_ids: string[]
  age_group_ids: string[]
  created_at: string
  updated_at: string
}

interface Episode {
  id: string
  channel_id: string
  title: string
  description: string
  order: number
  subtitle_url: string
  status: string
  created_at: string
  updated_at: string
}

interface SearchResults {
  channels: Channel[]
  episodes: Episode[]
}

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) {
        setError('خطا در جستجو')
        setResults(null)
        return
      }
      const data: SearchResults = await res.json()
      setResults(data)
    } catch {
      setError('خطا در اتصال به سرور')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 300)
  }

  const hasResults =
    results && (results.channels.length > 0 || results.episodes.length > 0)
  const noResults =
    results && results.channels.length === 0 && results.episodes.length === 0

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Search input bar */}
      <div className="sticky top-0 z-10 clay-frosted border-b-[3px] border-[var(--color-border)] px-4 py-3">
        <div className="relative mx-auto max-w-2xl">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="جستجو..."
            className="w-full min-h-[48px] pr-10 pl-4 clay-input text-sm font-medium"
            dir="rtl"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults(null)
                inputRef.current?.focus()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
              aria-label="پاک کردن جستجو"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="px-4 py-4 mx-auto max-w-7xl">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-[var(--color-error)] py-8">{error}</p>
        )}

        {!loading && noResults && (
          <p className="text-center text-[var(--color-text-muted)] py-12 text-lg">نتیجه‌ای یافت نشد</p>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-faint)]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4 opacity-30 text-[var(--color-primary)]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-lg">برای جستجو تایپ کنید</p>
          </div>
        )}

        {!loading && hasResults && (
          <>
            {results!.channels.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-bold text-[var(--color-text)] mb-3">کانال‌ها</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results!.channels.map((ch, i) => (
                    <ThumbnailCard
                      key={ch.id}
                      title={ch.name}
                      thumbnail={ch.thumbnail}
                      href={`/channel/${ch.id}`}
                      subtitle={ch.description}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {results!.episodes.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[var(--color-text)] mb-3">قسمت‌ها</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results!.episodes.map((ep, i) => (
                    <ThumbnailCard
                      key={ep.id}
                      title={ep.title}
                      href={`/watch/${ep.id}`}
                      subtitle={`قسمت ${ep.order}`}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Restyle BookmarkButton**

Replace entire `site-app/src/components/BookmarkButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface BookmarkButtonProps {
  episodeId: string
  initialBookmarked: boolean
}

export default function BookmarkButton({ episodeId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)

    // Optimistic update
    const wasBookmarked = bookmarked
    setBookmarked(!wasBookmarked)

    try {
      const method = wasBookmarked ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/bookmarks/${episodeId}`, { method })

      if (res.status === 401) {
        // Guest — revert optimistic update and redirect to login
        setBookmarked(wasBookmarked)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        // Unexpected error — revert optimistic update
        setBookmarked(wasBookmarked)
      }
      // 201, 200, or 409 — keep the optimistic state
    } catch {
      // Network error — revert optimistic update
      setBookmarked(wasBookmarked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={bookmarked ? 'حذف نشان' : 'نشان کردن'}
      className={[
        'p-2 rounded-2xl border-[3px] min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow-hover)] active:translate-y-[1px] active:scale-95',
        bookmarked
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-hover)] border-[var(--color-primary-light)]'
          : 'text-[var(--color-text-muted)] bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary-light)]',
      ].join(' ')}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
```

**Step 3: Restyle SubscribeButton**

Replace entire `site-app/src/components/SubscribeButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface SubscribeButtonProps {
  channelId: string
  initialSubscribed: boolean
}

export default function SubscribeButton({ channelId, initialSubscribed }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)

    // Optimistic update
    const wasSubscribed = subscribed
    setSubscribed(!wasSubscribed)

    try {
      const method = wasSubscribed ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/subscriptions/${channelId}`, { method })

      if (res.status === 401) {
        // Guest — revert optimistic update and redirect to login
        setSubscribed(wasSubscribed)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        // Unexpected error — revert optimistic update
        setSubscribed(wasSubscribed)
      }
      // 201, 200, or 409 (already subscribed) — keep the optimistic state
    } catch {
      // Network error — revert optimistic update
      setSubscribed(wasSubscribed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={[
        'min-h-[44px] px-6 rounded-2xl font-medium border-[3px] transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow-hover)] active:translate-y-[1px] active:scale-[0.97]',
        subscribed
          ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
          : 'bg-[var(--color-primary)] text-white border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)]',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {subscribed ? 'عضو هستید' : 'عضویت'}
    </button>
  )
}
```

**Step 4: Restyle CountdownOverlay**

Replace entire `site-app/src/components/CountdownOverlay.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

interface CountdownOverlayProps {
  nextEpisode: { id: string; title: string; order: number }
  onCancel: () => void
  onProceed: () => void
}

export default function CountdownOverlay({ nextEpisode, onCancel, onProceed }: CountdownOverlayProps) {
  const [seconds, setSeconds] = useState(7)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onProceed()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onProceed])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-[20px]">
      <div className="bg-[var(--color-surface)] rounded-[20px] p-6 text-center border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] max-w-xs mx-4" dir="rtl">
        <p className="text-sm text-[var(--color-text-muted)] mb-2">قسمت بعدی در {seconds} ثانیه</p>
        <p className="font-bold text-lg text-[var(--color-text)] mb-1">{nextEpisode.title}</p>
        <p className="text-sm text-[var(--color-text-faint)] mb-4">قسمت {nextEpisode.order}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-2xl font-medium min-h-[48px] cursor-pointer transition-all duration-200 hover:border-[var(--color-primary-light)] text-[var(--color-text)]"
          >
            لغو
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-3 bg-[var(--color-primary)] text-white border-[3px] border-[var(--color-primary-dark)] rounded-2xl font-medium min-h-[48px] cursor-pointer shadow-[var(--clay-shadow)] transition-all duration-200 hover:-translate-y-0.5"
          >
            پخش
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Restyle ProfileDropdown**

Replace entire `site-app/src/components/ProfileDropdown.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

interface ProfileDropdownProps {
  email: string
}

export default function ProfileDropdown({ email }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = email?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar circle */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="منوی حساب کاربری"
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--clay-shadow)]"
      >
        {initial}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow-hover)] py-2 min-w-[200px] z-50">
          {/* User email */}
          <div className="px-4 py-2 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] truncate">
            {email}
          </div>

          <Link
            href="/subscriptions"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            کانال‌های من
          </Link>

          <Link
            href="/bookmarks"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            نشان‌شده‌ها
          </Link>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            حساب کاربری
          </Link>

          <div className="border-t border-[var(--color-border)] my-1" />

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              خروج
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add site-app/src/components/SearchOverlay.tsx site-app/src/components/BookmarkButton.tsx site-app/src/components/SubscribeButton.tsx site-app/src/components/CountdownOverlay.tsx site-app/src/components/ProfileDropdown.tsx
git commit -m "style: apply Claymorphism to all interactive components"
```

---

### Task 5: Home + Browse Pages

**Files:**
- Modify: `site-app/src/app/page.tsx`
- Modify: `site-app/src/app/browse/page.tsx`
- Modify: `site-app/src/app/browse/[categoryId]/page.tsx`

**Step 1: Update Home page**

In `site-app/src/app/page.tsx`, make these edits:

1. Change `<div className="min-h-screen bg-white">` → `<div className="min-h-screen bg-[var(--color-bg)]">`

2. Pass `index` prop to all ThumbnailCard instances. For each `.map()`, pass the map index:
   - `subscribedChannels.map((ch, i) => (` → add `index={i}` to ThumbnailCard
   - `featuredEpisodes.map((ep, i) => (` → add `index={i}` to ThumbnailCard
   - `channels.map((ch, i) => (` → add `index={i}` to ThumbnailCard

3. Change empty state: `text-gray-400` → `text-[var(--color-text-faint)]`, `text-gray-500` inside → stays as subtitle class

Full empty state replacement:
```tsx
<div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-faint)]">
  <p className="text-xl">محتوایی یافت نشد</p>
  <p className="text-sm mt-2 text-[var(--color-text-muted)]">فیلتر سنی دیگری را امتحان کنید</p>
</div>
```

**Step 2: Restyle Browse page**

Replace entire `site-app/src/app/browse/page.tsx`:

```tsx
import { apiServerFetch } from '@/lib/api'
import type { Category } from '@/lib/types'

// Cycle through pastel colors for category cards
const pastelColors = [
  { bg: 'bg-[#FDBCB4]', text: 'text-[#7A3A30]', border: 'border-[#E8A69C]' },
  { bg: 'bg-[#ADD8E6]', text: 'text-[#2A5F71]', border: 'border-[#8DC0D0]' },
  { bg: 'bg-[#98FF98]', text: 'text-[#2D6B2D]', border: 'border-[#78D878]' },
  { bg: 'bg-[#E6E6FA]', text: 'text-[#4A4A6A]', border: 'border-[#C6C6DA]' },
  { bg: 'bg-[#FFE4A0]', text: 'text-[#6B5A20]', border: 'border-[#E0C880]' },
  { bg: 'bg-[#FFB3D9]', text: 'text-[#7A3055]', border: 'border-[#E093B9]' },
]

export default async function BrowsePage() {
  const res = await apiServerFetch('/categories')
  const categories: Category[] = res.ok ? await res.json() : []

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">دسته‌بندی‌ها</h1>

        {categories.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-16 text-lg">دسته‌بندی‌ای موجود نیست</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => {
              const color = pastelColors[idx % pastelColors.length]
              return (
                <a
                  key={cat.id}
                  href={`/browse/${cat.id}`}
                  className={[
                    'min-h-[120px] rounded-[20px] border-[3px] flex items-center justify-center p-4 text-center font-bold text-lg no-underline cursor-pointer',
                    'shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),4px_4px_10px_rgba(0,0,0,0.08)]',
                    'transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
                    'hover:-translate-y-[3px] hover:shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),6px_8px_16px_rgba(0,0,0,0.12)]',
                    'active:translate-y-[1px] active:scale-[0.97]',
                    color.bg, color.text, color.border,
                  ].join(' ')}
                >
                  {cat.name}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Restyle Category page**

In `site-app/src/app/browse/[categoryId]/page.tsx`, make these edits:

1. `bg-gray-50` → `bg-[var(--color-bg)]`
2. `text-gray-900` → `text-[var(--color-text)]`
3. Back button: `text-blue-500 hover:text-blue-700` → `text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]`
4. Empty state: `text-gray-500` → `text-[var(--color-text-muted)]`
5. Pass `index={i}` to all ThumbnailCard instances in the channels `.map()`:
   - `channels.map((ch) => (` → `channels.map((ch, i) => (`
   - Add `index={i}` prop to ThumbnailCard

**Step 4: Commit**

```bash
git add site-app/src/app/page.tsx site-app/src/app/browse/page.tsx site-app/src/app/browse/\[categoryId\]/page.tsx
git commit -m "style: apply Claymorphism to Home, Browse, and Category pages"
```

---

### Task 6: Channel + Watch Pages

**Files:**
- Modify: `site-app/src/app/channel/[id]/page.tsx`
- Modify: `site-app/src/app/watch/[id]/page.tsx`
- Modify: `site-app/src/app/watch/[id]/WatchClient.tsx`

**Step 1: Restyle Channel page**

In `site-app/src/app/channel/[id]/page.tsx`, make these edits:

1. Not-found state: `bg-gray-50` → `bg-[var(--color-bg)]`, `text-gray-400` → `text-[var(--color-text-faint)]`, `text-blue-500 hover:underline` → `text-[var(--color-primary)] hover:underline`

2. Main wrapper: `bg-white` → `bg-[var(--color-bg)]`

3. Back button: `text-blue-500 hover:text-blue-700` → `text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]`

4. Hero fallback gradient: `from-blue-400 via-purple-400 to-pink-400` → `from-[#FDBCB4] via-[#E6E6FA] to-[#ADD8E6]`

5. Description border: `border-b border-gray-100` → `border-b-[3px] border-[var(--color-border)]`

6. Description text: `text-gray-600` → `text-[var(--color-text-muted)]`

7. Episodes heading: `text-gray-900` → `text-[var(--color-text)]`

8. Empty episodes: `text-gray-500` → `text-[var(--color-text-muted)]`

9. Pass `index={i}` to ThumbnailCard in episodes map

**Step 2: Restyle Watch page**

In `site-app/src/app/watch/[id]/page.tsx`, make these edits:

1. Not-found: `text-gray-700` → `text-[var(--color-text)]`, `text-blue-500` → `text-[var(--color-primary)]`

2. "Other episodes" heading: `text-lg font-bold mb-4` → `text-lg font-bold mb-4 text-[var(--color-text)]`

3. Pass `index={i}` to ThumbnailCard in otherEpisodes map

**Step 3: Restyle WatchClient**

In `site-app/src/app/watch/[id]/WatchClient.tsx`, make these edits:

1. Player wrapper: `rounded-2xl overflow-hidden shadow-lg` → `rounded-[20px] overflow-hidden border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)]`

2. Channel link: `text-blue-500` → `text-[var(--color-primary)]`

3. Description: `text-gray-600` → `text-[var(--color-text-muted)]`

**Step 4: Commit**

```bash
git add site-app/src/app/channel/\[id\]/page.tsx site-app/src/app/watch/\[id\]/page.tsx site-app/src/app/watch/\[id\]/WatchClient.tsx
git commit -m "style: apply Claymorphism to Channel and Watch pages"
```

---

### Task 7: Auth Pages — Login + Register

**Files:**
- Modify: `site-app/src/app/login/page.tsx`
- Modify: `site-app/src/app/register/page.tsx`

**Step 1: Restyle Login page**

Replace entire `site-app/src/app/login/page.tsx`:

```tsx
'use client'
import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('return') ?? '/'
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="font-display text-2xl font-bold text-[var(--color-primary)]" style={{ textShadow: '2px 2px 0px rgba(255,138,122,0.15)' }}>کیدتیوب</span>
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text)] text-center mb-6">ورود به حساب</h1>

        <form action={formAction} className="flex flex-col gap-4" dir="rtl">
          <input
            name="email"
            type="email"
            placeholder="ایمیل"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="رمز عبور"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />
          <input type="hidden" name="return" value={returnUrl} />

          {state?.error && (
            <p className="text-[var(--color-error)] text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold rounded-2xl min-h-[48px] border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] transition-all duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-4">
          حساب کاربری ندارید؟{' '}
          <Link href="/register" className="text-[var(--color-primary)] hover:underline">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]" />}>
      <LoginForm />
    </Suspense>
  )
}
```

**Step 2: Restyle Register page**

Replace entire `site-app/src/app/register/page.tsx`:

```tsx
'use client'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm_password') as HTMLInputElement).value

    if (password !== confirm) {
      e.preventDefault()
      setPasswordError('رمز عبور و تکرار آن یکسان نیستند')
      return
    }
    setPasswordError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="font-display text-2xl font-bold text-[var(--color-primary)]" style={{ textShadow: '2px 2px 0px rgba(255,138,122,0.15)' }}>کیدتیوب</span>
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text)] text-center mb-6">ثبت‌نام</h1>

        <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4" dir="rtl">
          <input
            name="email"
            type="email"
            placeholder="ایمیل"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="رمز عبور (حداقل ۸ کاراکتر)"
            dir="ltr"
            required
            minLength={8}
            className="clay-input px-4 py-3 text-sm"
          />
          <input
            name="confirm_password"
            type="password"
            placeholder="تکرار رمز عبور"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />

          {(passwordError || state?.error) && (
            <p className="text-[var(--color-error)] text-sm text-center">
              {passwordError ?? state?.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold rounded-2xl min-h-[48px] border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] transition-all duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-4">
          قبلاً حساب دارید؟{' '}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add site-app/src/app/login/page.tsx site-app/src/app/register/page.tsx
git commit -m "style: apply Claymorphism to Login and Register pages"
```

---

### Task 8: Protected Pages — Subscriptions, Bookmarks, Account, ChangePasswordForm

**Files:**
- Modify: `site-app/src/app/subscriptions/page.tsx`
- Modify: `site-app/src/app/bookmarks/page.tsx`
- Modify: `site-app/src/app/account/page.tsx`
- Modify: `site-app/src/app/account/ChangePasswordForm.tsx`

**Step 1: Restyle Subscriptions page**

In `site-app/src/app/subscriptions/page.tsx`, make these edits:

1. `bg-white` → `bg-[var(--color-bg)]`
2. `text-gray-900` → `text-[var(--color-text)]`
3. Empty state SVG: `text-gray-300` → `text-[var(--color-primary)] opacity-30`
4. Empty state text: `text-gray-500` → `text-[var(--color-text-muted)]`
5. Empty state link: `text-blue-500 hover:text-blue-700` → `text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]`
6. Empty state `text-gray-400` on container div → `text-[var(--color-text-faint)]`
7. Pass `index={i}` to ThumbnailCard in channels map

**Step 2: Restyle Bookmarks page**

In `site-app/src/app/bookmarks/page.tsx`, make the same edits as Subscriptions:

1. `bg-white` → `bg-[var(--color-bg)]`
2. `text-gray-900` → `text-[var(--color-text)]`
3. Empty state SVG: `text-gray-300` → `text-[var(--color-primary)] opacity-30`
4. Empty state text: `text-gray-500` → `text-[var(--color-text-muted)]`
5. Empty state link: `text-blue-500 hover:text-blue-700` → `text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]`
6. Empty state `text-gray-400` on container div → `text-[var(--color-text-faint)]`
7. Pass `index={i}` to ThumbnailCard in episodes map

**Step 3: Restyle Account page**

Replace entire `site-app/src/app/account/page.tsx`:

```tsx
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser } from '@/lib/types'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata = {
  title: 'حساب کاربری — کیدتیوب',
}

export default async function AccountPage() {
  // proxy.ts redirects guests to /login so this page always has a valid token
  const token = await getSiteSession()
  let user: SiteUser | null = null

  if (token) {
    const res = await apiServerAuthFetch('/me', token)
    if (res.ok) {
      user = await res.json()
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">حساب کاربری</h1>

        {/* User info card */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6 mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-1">ایمیل</h2>
          <p className="text-[var(--color-text)] font-medium">{user?.email ?? '—'}</p>
        </div>

        {/* Change password card */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">تغییر رمز عبور</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Restyle ChangePasswordForm**

Replace entire `site-app/src/app/account/ChangePasswordForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }

    setLoading(true)
    try {
      const res = await authFetch('/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (res.status === 401) {
        setError('رمز عبور فعلی اشتباه است')
        return
      }
      if (res.status === 400) {
        const text = await res.text()
        setError(text || 'درخواست نامعتبر است')
        return
      }
      if (!res.ok) {
        setError('تغییر رمز عبور ناموفق بود. دوباره تلاش کنید.')
        return
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('اتصال به سرور برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="current_password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          رمز عبور فعلی
        </label>
        <input
          id="current_password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full clay-input px-4 py-2.5 text-sm"
          placeholder="رمز عبور فعلی"
        />
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          رمز عبور جدید
        </label>
        <input
          id="new_password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full clay-input px-4 py-2.5 text-sm"
          placeholder="حداقل ۸ کاراکتر"
        />
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          تکرار رمز عبور جدید
        </label>
        <input
          id="confirm_password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full clay-input px-4 py-2.5 text-sm"
          placeholder="تکرار رمز عبور جدید"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-[var(--color-mint)] bg-[#F0FFF4] rounded-2xl border-[3px] border-[#B8E8C8] px-3 py-2">
          رمز عبور تغییر کرد
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? 'در حال ذخیره...' : 'ذخیره'}
      </button>
    </form>
  )
}
```

**Step 5: Commit**

```bash
git add site-app/src/app/subscriptions/page.tsx site-app/src/app/bookmarks/page.tsx site-app/src/app/account/page.tsx site-app/src/app/account/ChangePasswordForm.tsx
git commit -m "style: apply Claymorphism to Subscriptions, Bookmarks, and Account pages"
```

---

### Task 9: Build Verification

**Files:** None (verification only)

**Step 1: Run build to verify no TypeScript or compilation errors**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds with no errors

**Step 2: If build fails, fix any issues**

Common issues to watch for:
- `Fredoka` or `Nunito` not found in `next/font/google` — check exact import names
- CSS custom property syntax issues in Tailwind v4
- Missing `index` prop on ThumbnailCard (need to check all usage sites)

**Step 3: Commit any fixes**

```bash
git add -u site-app/
git commit -m "fix: resolve build issues from Claymorphism redesign"
```
