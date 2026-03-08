'use client'

import { useSidebar } from '@/components/SidebarContext'

export default function TopBarClient() {
  const { toggle } = useSidebar()

  return (
    <button
      onClick={toggle}
      data-tour="sidebar"
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
