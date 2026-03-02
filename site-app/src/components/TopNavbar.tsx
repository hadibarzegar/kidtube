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
