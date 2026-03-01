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
    <header className="hidden md:flex items-center bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl w-full flex items-center justify-between">
        {/* Logo — right side in RTL */}
        <Link href="/" className="text-2xl font-bold text-blue-500 no-underline">
          کیدتیوب
        </Link>

        {/* Navigation links — left side in RTL */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors no-underline"
          >
            خانه
          </Link>
          <Link
            href="/browse"
            className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors no-underline"
          >
            دسته‌بندی‌ها
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors no-underline"
          >
            جستجو
          </Link>

          {/* Auth state */}
          {user && userEmail ? (
            <ProfileDropdown email={userEmail} />
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-blue-500 hover:text-blue-700 border border-blue-500 rounded-full px-4 min-h-[40px] flex items-center no-underline transition-colors"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
