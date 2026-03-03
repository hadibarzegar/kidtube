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
