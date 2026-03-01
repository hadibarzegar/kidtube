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
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 md:hidden"
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
                active ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
