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
