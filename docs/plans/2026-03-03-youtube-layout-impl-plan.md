# YouTube-Style Layout Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the KidTube site-app from top-navbar + horizontal-rails to YouTube-style layout with collapsible sidebar, video grid homepage, rich cards, and two-column watch page.

**Architecture:** Replace the current `TopNavbar` + full-width content layout with a 3-zone shell (TopBar + Sidebar + Content). Homepage switches from horizontal rails to a responsive video grid. Watch page gets a two-column layout with recommendation sidebar on desktop.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, existing claymorphism design tokens

---

### Task 1: Add sidebar CSS to globals.css

**Files:**
- Modify: `site-app/src/app/globals.css:60` (after scrollbar-hide utility)

**Step 1: Add sidebar transition and layout utilities**

Add after the `.scrollbar-hide` block (around line 67) in `globals.css`:

```css
/* Sidebar */
.sidebar-expanded {
  width: 240px;
}
.sidebar-collapsed {
  width: 72px;
}
.sidebar-transition {
  transition: width 0.3s var(--clay-bounce);
}
```

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/app/globals.css
git commit -m "style: add sidebar CSS utilities to globals.css"
```

---

### Task 2: Create Sidebar component

**Files:**
- Create: `site-app/src/components/Sidebar.tsx`

**Step 1: Create the Sidebar component**

```tsx
'use client'

import { usePathname } from 'next/navigation'

const navItems = [
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
    label: 'دسته‌بندی‌ها',
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
    label: 'اشتراک‌ها',
    href: '/subscriptions',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'نشان‌شده‌ها',
    href: '/bookmarks',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'حساب کاربری',
    href: '/account',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-[57px] bottom-0 right-0 z-30 bg-[var(--color-surface)] border-l-[3px] border-[var(--color-border)] sidebar-transition overflow-hidden ${
        collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
      }`}
    >
      <nav className="flex flex-col gap-1 py-2 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <a
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                'flex items-center gap-3 rounded-[var(--clay-radius-sm)] no-underline transition-all duration-200 min-h-[48px]',
                collapsed ? 'justify-center px-0' : 'px-4',
                isActive
                  ? 'bg-[var(--color-primary-hover)] text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-primary)]',
              ].join(' ')}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}
```

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/components/Sidebar.tsx
git commit -m "feat: add collapsible Sidebar component"
```

---

### Task 3: Create TopBar component

**Files:**
- Create: `site-app/src/components/TopBar.tsx`

**Step 1: Create the TopBar server component**

```tsx
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import ProfileDropdown from '@/components/ProfileDropdown'
import TopBarClient from '@/components/TopBarClient'
import type { SiteUser } from '@/lib/types'

export default async function TopBar() {
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
    <header className="sticky top-0 z-40 clay-frosted border-b-[3px] border-[var(--color-border)] shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between px-4 md:px-6 h-[56px]">
        {/* Right side (RTL): Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <TopBarClient />
          <Link
            href="/"
            className="font-display text-xl md:text-2xl font-bold text-[var(--color-primary)] no-underline"
            style={{ textShadow: '2px 2px 0px rgba(255,138,122,0.15)' }}
          >
            کیدتیوب
          </Link>
        </div>

        {/* Center: Search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <form action="/search" method="GET" className="relative w-full">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              name="q"
              placeholder="جستجو..."
              className="w-full min-h-[40px] pr-10 pl-4 clay-input text-sm font-medium rounded-full"
              dir="rtl"
            />
          </form>
        </div>

        {/* Left side (RTL): User avatar or login */}
        <div className="flex items-center">
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
        </div>
      </div>
    </header>
  )
}
```

**Step 2: Create the TopBarClient component (hamburger toggle)**

Create `site-app/src/components/TopBarClient.tsx`:

```tsx
'use client'

import { useSidebar } from '@/components/SidebarContext'

export default function TopBarClient() {
  const { toggle } = useSidebar()

  return (
    <button
      onClick={toggle}
      className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
      aria-label="تغییر منوی کناری"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  )
}
```

**Step 3: Create SidebarContext**

Create `site-app/src/components/SidebarContext.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
```

**Step 4: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add site-app/src/components/TopBar.tsx site-app/src/components/TopBarClient.tsx site-app/src/components/SidebarContext.tsx
git commit -m "feat: add TopBar and SidebarContext components"
```

---

### Task 4: Create LayoutShell client wrapper

**Files:**
- Create: `site-app/src/components/LayoutShell.tsx`

**Step 1: Create LayoutShell that wires sidebar + content area**

```tsx
'use client'

import { useSidebar } from '@/components/SidebarContext'
import Sidebar from '@/components/Sidebar'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <>
      <Sidebar collapsed={collapsed} />
      <main
        className={`pb-20 md:pb-0 transition-all duration-300 min-h-[calc(100vh-57px)] ${
          collapsed ? 'md:mr-[72px]' : 'md:mr-[240px]'
        }`}
        style={{ transitionTimingFunction: 'var(--clay-bounce)' }}
      >
        {children}
      </main>
    </>
  )
}
```

Note: `md:mr-[72px]` / `md:mr-[240px]` because RTL — sidebar is on the right, so content needs `margin-right`.

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/components/LayoutShell.tsx
git commit -m "feat: add LayoutShell wrapper for sidebar + content"
```

---

### Task 5: Update root layout.tsx to use new shell

**Files:**
- Modify: `site-app/src/app/layout.tsx`

**Step 1: Replace TopNavbar with TopBar + SidebarProvider + LayoutShell**

Replace the entire content of `layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
import TopBar from '@/components/TopBar';
import BottomTabBar from '@/components/BottomTabBar';
import { SidebarProvider } from '@/components/SidebarContext';
import LayoutShell from '@/components/LayoutShell';
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
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[var(--color-bg)]">
        <SidebarProvider>
          <div className="min-h-screen">
            <TopBar />
            <LayoutShell>
              {children}
            </LayoutShell>
            <BottomTabBar />
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
```

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/app/layout.tsx
git commit -m "feat: update root layout to 3-zone shell with sidebar"
```

---

### Task 6: Create CategoryChips component (adapted from AgeFilterTabs)

**Files:**
- Create: `site-app/src/components/CategoryChips.tsx`

**Step 1: Create CategoryChips**

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/types'

interface CategoryChipsProps {
  categories: Category[]
  selectedId: string | null
}

export default function CategoryChips({ categories, selectedId }: CategoryChipsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === null) {
      params.delete('category_id')
    } else {
      params.set('category_id', id)
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  const tabs = [
    { id: null, label: 'همه' },
    ...categories.map((cat) => ({ id: cat.id, label: cat.name })),
  ]

  return (
    <div className="sticky top-[56px] z-20 clay-frosted border-b border-[var(--color-border)] py-2">
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        {tabs.map((tab) => {
          const isActive = tab.id === selectedId
          return (
            <button
              key={tab.id ?? 'all'}
              onClick={() => handleSelect(tab.id)}
              className={[
                'min-h-[36px] px-4 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer border-[2px]',
                isActive
                  ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-text)] hover:bg-[var(--color-primary-hover)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

Note: Chips are styled like YouTube's — active chip has dark fill with white text (instead of coral). `sticky top-[56px]` to sit below the TopBar (56px height).

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/components/CategoryChips.tsx
git commit -m "feat: add CategoryChips component for homepage filtering"
```

---

### Task 7: Rewrite ThumbnailCard as YouTube-style rich card

**Files:**
- Modify: `site-app/src/components/ThumbnailCard.tsx`

**Step 1: Rewrite ThumbnailCard with channel avatar and metadata**

Replace the entire file:

```tsx
import { resolveImageUrl } from '@/lib/image'

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
  index?: number
  // Channel info (optional — for episode cards)
  channelName?: string
  channelThumbnail?: string
  channelHref?: string
  // Episode info (optional)
  episodeNumber?: number
  // Subtitle fallback (for channel cards without episode metadata)
  subtitle?: string
}

export default function ThumbnailCard({
  title,
  thumbnail,
  href,
  index = 0,
  channelName,
  channelThumbnail,
  channelHref,
  episodeNumber,
  subtitle,
}: ThumbnailCardProps) {
  const resolvedThumbnail = resolveImageUrl(thumbnail)
  const resolvedChannelThumb = resolveImageUrl(channelThumbnail)
  const pastelBg = pastelColors[index % pastelColors.length]
  const channelInitial = channelName?.charAt(0) || title.charAt(0)

  return (
    <div className="group">
      {/* Thumbnail */}
      <a href={href} className="block no-underline">
        <div className="aspect-video relative rounded-[var(--clay-radius)] overflow-hidden transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[2px] group-hover:shadow-[var(--clay-shadow-hover)] group-active:translate-y-[1px] group-active:scale-[0.98]">
          {resolvedThumbnail ? (
            <img
              src={resolvedThumbnail}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${pastelBg} flex items-center justify-center`}>
              <span className="text-white text-3xl font-bold opacity-70 drop-shadow-sm">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </a>

      {/* Info area */}
      <div className="flex gap-3 mt-3 px-0.5">
        {/* Channel avatar */}
        {channelName && (
          <a
            href={channelHref || href}
            className="flex-shrink-0 no-underline"
          >
            {resolvedChannelThumb ? (
              <img
                src={resolvedChannelThumb}
                alt={channelName}
                className="w-9 h-9 rounded-full object-cover border-2 border-[var(--color-border)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--color-secondary-light)] flex items-center justify-center border-2 border-[var(--color-secondary)]">
                <span className="text-[var(--color-secondary)] font-bold text-sm">
                  {channelInitial}
                </span>
              </div>
            )}
          </a>
        )}

        {/* Text info */}
        <div className="min-w-0 flex-1">
          <a href={href} className="no-underline">
            <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug">
              {title}
            </p>
          </a>
          {channelName && (
            <a
              href={channelHref || href}
              className="no-underline block"
            >
              <p className="text-xs text-[var(--color-text-muted)] mt-1 hover:text-[var(--color-text)] transition-colors">
                {channelName}
              </p>
            </a>
          )}
          {episodeNumber !== undefined && episodeNumber > 0 && (
            <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
              قسمت {episodeNumber}
            </p>
          )}
          {!channelName && subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

Key changes:
- Removed fixed `w-[180px]` and snap-start classes (no longer in horizontal rails)
- Removed outer card border (cleaner YouTube style)
- Added channel avatar, channel name, episode number
- Thumbnail gets rounded corners, hover effect on thumbnail only
- Info area with avatar sits below thumbnail

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/components/ThumbnailCard.tsx
git commit -m "feat: rewrite ThumbnailCard as YouTube-style rich card"
```

---

### Task 8: Create MiniCard component for watch page sidebar

**Files:**
- Create: `site-app/src/components/MiniCard.tsx`

**Step 1: Create the horizontal mini card**

```tsx
import { resolveImageUrl } from '@/lib/image'

interface MiniCardProps {
  title: string
  thumbnail?: string
  href: string
  channelName?: string
  episodeNumber?: number
}

export default function MiniCard({ title, thumbnail, href, channelName, episodeNumber }: MiniCardProps) {
  const resolvedThumbnail = resolveImageUrl(thumbnail)

  return (
    <a href={href} className="flex gap-2 no-underline group">
      {/* Thumbnail */}
      <div className="w-[168px] flex-shrink-0 aspect-video relative rounded-[var(--clay-radius-xs)] overflow-hidden group-hover:shadow-[var(--clay-shadow)] transition-shadow">
        {resolvedThumbnail ? (
          <img
            src={resolvedThumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-secondary-light)] flex items-center justify-center">
            <span className="text-[var(--color-secondary)] text-xl font-bold opacity-70">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </p>
        {channelName && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
            {channelName}
          </p>
        )}
        {episodeNumber !== undefined && episodeNumber > 0 && (
          <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
            قسمت {episodeNumber}
          </p>
        )}
      </div>
    </a>
  )
}
```

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/components/MiniCard.tsx
git commit -m "feat: add MiniCard component for watch page sidebar"
```

---

### Task 9: Rewrite homepage with video grid

**Files:**
- Modify: `site-app/src/app/page.tsx`

**Step 1: Replace homepage with grid layout**

Replace entire file:

```tsx
import { Suspense } from 'react'
import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import type { Category, Channel, Episode } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'
import CategoryChips from '@/components/CategoryChips'

interface HomePageProps {
  searchParams: Promise<{ category_id?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const categoryId = params.category_id ?? null

  // Parallel fetch for categories and episodes
  const [categoriesRes, episodesRes] = await Promise.all([
    apiServerFetch('/categories'),
    categoryId
      ? apiServerFetch(`/episodes?category_id=${encodeURIComponent(categoryId)}`)
      : apiServerFetch('/episodes'),
  ])

  const categories: Category[] = categoriesRes.ok ? await categoriesRes.json() : []
  const episodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Fetch channel info for each unique channel_id in episodes
  const channelIds = [...new Set(episodes.map((ep) => ep.channel_id))]
  const channelMap = new Map<string, Channel>()

  if (channelIds.length > 0) {
    const channelResults = await Promise.all(
      channelIds.map(async (id) => {
        const res = await apiServerFetch(`/channels/${id}`)
        if (res.ok) {
          const ch: Channel = await res.json()
          return ch
        }
        return null
      })
    )
    channelResults.forEach((ch) => {
      if (ch) channelMap.set(ch.id, ch)
    })
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Category filter chips */}
      <Suspense fallback={<div className="h-12 px-4 py-2 flex gap-2 overflow-hidden" />}>
        <CategoryChips categories={categories} selectedId={categoryId} />
      </Suspense>

      {/* Video grid */}
      <div className="px-4 md:px-6 py-4 mx-auto max-w-[1800px]">
        {episodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {episodes.map((ep, i) => {
              const channel = channelMap.get(ep.channel_id)
              return (
                <ThumbnailCard
                  key={ep.id}
                  title={ep.title}
                  thumbnail={ep.thumbnail}
                  href={`/watch/${ep.id}`}
                  index={i}
                  channelName={channel?.name}
                  channelThumbnail={channel?.thumbnail}
                  channelHref={channel ? `/channel/${channel.id}` : undefined}
                  episodeNumber={ep.order}
                />
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-faint)]">
            <p className="text-xl">محتوایی یافت نشد</p>
            <p className="text-sm mt-2 text-[var(--color-text-muted)]">
              دسته‌بندی دیگری را امتحان کنید
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

Key changes:
- `HorizontalRail` replaced with a responsive CSS grid
- `AgeFilterTabs` replaced with `CategoryChips` (filters by category)
- Each episode card shows channel avatar + name + episode number
- Channel data fetched in parallel per unique `channel_id`

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/app/page.tsx
git commit -m "feat: rewrite homepage with YouTube-style video grid"
```

---

### Task 10: Rewrite watch page with two-column layout

**Files:**
- Modify: `site-app/src/app/watch/[id]/page.tsx`

**Step 1: Update watch page to two-column layout**

Replace entire file:

```tsx
import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import WatchClient from '@/app/watch/[id]/WatchClient'
import MiniCard from '@/components/MiniCard'
import type { Episode, Channel } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const res = await apiServerFetch(`/episodes/${id}`)
  if (!res.ok) return { title: 'کیدتیوب' }
  const episode: Episode = await res.json()
  return { title: `${episode.title} — کیدتیوب` }
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params

  // Fetch episode
  const episodeRes = await apiServerFetch(`/episodes/${id}`)
  if (!episodeRes.ok) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-2xl font-bold text-[var(--color-text)] mb-4">ویدیو یافت نشد</p>
        <a href="/" className="text-[var(--color-primary)] hover:underline">
          بازگشت به صفحه اصلی
        </a>
      </div>
    )
  }

  const episode: Episode = await episodeRes.json()

  // Fetch channel, all episodes in this channel, and auth state in parallel
  const [channelRes, episodesRes, user] = await Promise.all([
    apiServerFetch(`/channels/${episode.channel_id}`),
    apiServerFetch(`/episodes?channel_id=${episode.channel_id}`),
    getCurrentUser(),
  ])

  const channel: Channel = channelRes.ok ? await channelRes.json() : { id: episode.channel_id, name: '' } as Channel
  const allEpisodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Compute next episode (order = current order + 1)
  const nextEpisode: Episode | null =
    allEpisodes.find((ep) => ep.order === episode.order + 1) ?? null

  // Filter out the current episode from the "other episodes" list
  const otherEpisodes = allEpisodes.filter((ep) => ep.id !== episode.id)

  // Check bookmark + subscription state for logged-in user
  let isBookmarked = false
  let isSubscribed = false
  if (user) {
    const token = await getSiteSession()
    if (token) {
      const [bookRes, subRes] = await Promise.all([
        apiServerAuthFetch('/me/bookmarks', token, { cache: 'no-store' }),
        apiServerAuthFetch('/me/subscriptions', token, { cache: 'no-store' }),
      ])
      if (bookRes.ok) {
        const bookmarks: Episode[] = await bookRes.json()
        isBookmarked = bookmarks.some((ep) => ep.id === id)
      }
      if (subRes.ok) {
        const subscriptions: Channel[] = await subRes.json()
        isSubscribed = subscriptions.some((ch) => ch.id === channel.id)
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 md:py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column: video + info */}
        <div className="flex-1 min-w-0">
          <WatchClient
            episode={episode}
            nextEpisode={nextEpisode}
            channel={channel}
            isBookmarked={isBookmarked}
            isSubscribed={isSubscribed}
            episodeId={episode.id}
          />
        </div>

        {/* Sidebar: other episodes (desktop: right column, mobile: below) */}
        {otherEpisodes.length > 0 && (
          <div className="lg:w-[400px] flex-shrink-0" dir="rtl">
            <h2 className="text-base font-bold mb-3 text-[var(--color-text)] font-display">
              قسمت‌های دیگر از {channel.name}
            </h2>
            <div className="flex flex-col gap-3">
              {otherEpisodes.map((ep) => (
                <MiniCard
                  key={ep.id}
                  title={ep.title}
                  thumbnail={ep.thumbnail}
                  href={`/watch/${ep.id}`}
                  channelName={channel.name}
                  episodeNumber={ep.order}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

Key changes:
- Container widened from `max-w-4xl` to `max-w-[1400px]`
- `flex-col lg:flex-row` creates two-column layout on desktop
- Sidebar is `lg:w-[400px]` with `MiniCard` components
- On mobile, sidebar stacks below video (single column)
- Removed the old grid of `ThumbnailCard` — replaced with `MiniCard` list

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/app/watch/[id]/page.tsx
git commit -m "feat: rewrite watch page with two-column layout"
```

---

### Task 11: Update search page

**Files:**
- Modify: `site-app/src/components/SearchOverlay.tsx`

**Step 1: Remove duplicate interfaces and sticky search bar**

The search input is now in the TopBar (desktop). Update SearchOverlay to:
- Import types from `@/lib/types` instead of local duplicates
- Remove the sticky search bar (desktop uses TopBar search; mobile keeps input)
- Accept an optional initial query from URL params

Replace entire file:

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import ThumbnailCard from '@/components/ThumbnailCard'
import type { Channel, Episode } from '@/lib/types'

interface SearchResults {
  channels: Channel[]
  episodes: Episode[]
}

export default function SearchOverlay() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Auto-search if URL has ?q=
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery, doSearch])

  // Auto-focus input on mount (mobile)
  useEffect(() => {
    inputRef.current?.focus()
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
      {/* Search input — visible as a standalone bar (mobile gets this, desktop has TopBar search too) */}
      <div className="px-4 py-3">
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
      <div className="px-4 py-4 mx-auto max-w-[1800px]">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                  {results!.episodes.map((ep, i) => (
                    <ThumbnailCard
                      key={ep.id}
                      title={ep.title}
                      thumbnail={ep.thumbnail}
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

Key changes:
- Imports from `@/lib/types` (no duplicate interfaces)
- Reads `?q=` from URL search params (for TopBar search form submission)
- Removed the old `sticky top-0` frosted search bar
- Grid uses same responsive columns as homepage

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/components/SearchOverlay.tsx
git commit -m "feat: update search page to use grid layout and URL params"
```

---

### Task 12: Update browse category detail pages

**Files:**
- Check: `site-app/src/app/browse/[categoryId]/page.tsx`

**Step 1: Read the category detail page and update card usage**

The category detail page currently uses `ThumbnailCard` to show channels. Since `ThumbnailCard` was rewritten with new props, update the usage to pass `subtitle` for channel description (no `channelName` needed since these are channel cards, not episode cards).

The grid classes should be updated to match the new responsive pattern:

Change the grid from:
```
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
```
to:
```
grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6
```

**Step 2: Read the browse index page and update similarly**

Check if `site-app/src/app/browse/page.tsx` uses `ThumbnailCard` — if so, update grid classes.

**Step 3: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add site-app/src/app/browse/
git commit -m "feat: update browse pages to use new grid layout"
```

---

### Task 13: Update channel page grid

**Files:**
- Modify: `site-app/src/app/channel/[id]/page.tsx`

**Step 1: Update the episodes grid and ThumbnailCard usage**

The channel page shows episodes for a channel. Update the `ThumbnailCard` usage to include `channelName`, `channelThumbnail`, `channelHref`, and `episodeNumber` props. Update the grid classes to the new responsive pattern.

**Step 2: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site-app/src/app/channel/
git commit -m "feat: update channel page to use rich cards and new grid"
```

---

### Task 14: Clean up old components

**Files:**
- Delete or keep: `site-app/src/components/TopNavbar.tsx`
- Keep: `site-app/src/components/HorizontalRail.tsx` (may still be used elsewhere)
- Keep: `site-app/src/components/AgeFilterTabs.tsx` (may still be used elsewhere)

**Step 1: Check if TopNavbar is still imported anywhere**

Run: `grep -r "TopNavbar" site-app/src/`

If only in `layout.tsx` (which was already updated), delete `TopNavbar.tsx`.

**Step 2: Check if HorizontalRail is still imported anywhere**

Run: `grep -r "HorizontalRail" site-app/src/`

If not imported anywhere, delete it. Otherwise, keep it.

**Step 3: Check if AgeFilterTabs is still imported anywhere**

Run: `grep -r "AgeFilterTabs" site-app/src/`

If not imported anywhere, delete it. Otherwise, keep it.

**Step 4: Verify build**

Run: `cd site-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A site-app/src/components/
git commit -m "chore: remove unused components after layout redesign"
```

---

### Task 15: Final verification

**Step 1: Full build**

Run: `cd site-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds with no errors

**Step 2: Visual check — start dev server**

Run: `cd site-app && npx next dev`

Check pages manually:
- `/` — Should show category chips + video grid
- `/watch/[id]` — Should show two-column layout on desktop
- `/search` — Should show grid results
- `/browse` — Should show category tiles
- Sidebar should toggle with hamburger on desktop
- Mobile should show bottom tab bar, no sidebar

**Step 3: Final commit if any tweaks needed**

```bash
git add -A site-app/
git commit -m "fix: address visual issues from YouTube layout redesign"
```
