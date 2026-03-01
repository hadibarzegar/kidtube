'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login' || pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gray-50 p-6 ml-64">
        {children}
      </main>
    </div>
  )
}
