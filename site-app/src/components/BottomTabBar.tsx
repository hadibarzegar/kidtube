'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const tabs = [
  {
    href: '/browse',
    color: '#7B5CA0',
    bgColor: '#EBD9FA',
    ariaLabel: 'دسته‌بندی',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    href: '/',
    color: '#C0453A',
    bgColor: '#FFE0D9',
    ariaLabel: 'خانه',
    isCenter: true,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/search',
    color: '#2A7FA0',
    bgColor: '#D0ECFA',
    ariaLabel: 'جستجو',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const [tappedTab, setTappedTab] = useState<string | null>(null)

  if (pathname.startsWith('/watch/')) return null

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function handleTap(href: string) {
    setTappedTab(href)
    setTimeout(() => setTappedTab(null), 500)
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="mx-3 mb-2 rounded-[22px] border-[3px] border-[var(--color-border)]"
        style={{
          background: 'var(--color-surface)',
          boxShadow: `
            0 -2px 20px rgba(0,0,0,0.06),
            0 4px 16px rgba(0,0,0,0.10),
            inset 0 1px 0 rgba(255,255,255,0.6),
            inset 0 -1px 3px rgba(0,0,0,0.04)
          `,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-end justify-around px-4 py-2 relative" style={{ minHeight: 56 }}>
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            const tapped = tappedTab === tab.href

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => handleTap(tab.href)}
                className="relative flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-full"
                aria-label={tab.ariaLabel}
                aria-current={active ? 'page' : undefined}
                style={{ width: 52, height: 52 }}
              >
                {/* Bubble background — lifts & scales on active */}
                <span
                  className="absolute inset-0 rounded-full transition-all duration-[400ms]"
                  style={{
                    background: active ? tab.bgColor : 'transparent',
                    transform: active
                      ? tapped
                        ? 'scale(0.85) translateY(-6px)'
                        : 'scale(1) translateY(-5px)'
                      : tapped
                        ? 'scale(0.9)'
                        : 'scale(0)',
                    opacity: active ? 1 : 0,
                    boxShadow: active
                      ? `0 4px 12px ${tab.bgColor}, inset 0 -2px 4px rgba(0,0,0,0.06), inset 0 2px 2px rgba(255,255,255,0.5)`
                      : 'none',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />

                {/* Icon */}
                <span
                  className="relative z-10 transition-all duration-[400ms]"
                  style={{
                    color: active ? tab.color : 'var(--color-text-muted)',
                    transform: active
                      ? tapped
                        ? 'scale(0.85) translateY(-6px)'
                        : 'scale(1.15) translateY(-5px)'
                      : tapped
                        ? 'scale(0.85)'
                        : 'scale(1)',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {tab.icon(active)}
                </span>

              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
