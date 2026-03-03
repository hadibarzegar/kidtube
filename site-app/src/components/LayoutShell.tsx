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
