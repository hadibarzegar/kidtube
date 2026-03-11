'use client'

import { useState, useCallback } from 'react'
import { useSidebar } from '@/components/SidebarContext'
import MobileDrawer from '@/components/MobileDrawer'

export default function TopBarClient() {
  const { toggle } = useSidebar()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <>
      {/* Desktop: toggle sidebar */}
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

      {/* Mobile: open drawer */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex md:hidden items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer active:scale-95"
        aria-label="باز کردن منو"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}
