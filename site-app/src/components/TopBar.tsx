import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import ProfileDropdown from '@/components/ProfileDropdown'
import TopBarClient from '@/components/TopBarClient'
import NotificationBell from '@/components/NotificationBell'
import VoiceSearchButton from '@/components/VoiceSearchButton'
import type { SiteUser } from '@/lib/types'

export default async function TopBar() {
  const user = await getCurrentUser()

  let userEmail: string | null = null
  if (user) {
    const token = await getSiteSession()
    if (token) {
      try {
        const meRes = await apiServerAuthFetch('/me', token)
        if (meRes.ok) {
          const me: SiteUser = await meRes.json()
          userEmail = me.email
        }
      } catch {
        // Backend unreachable — degrade gracefully to logged-out state
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 clay-frosted border-b border-[var(--color-border)] shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-[56px]">
        {/* Right side (RTL): Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <TopBarClient />
          <Link href="/" className="no-underline flex items-center">
            <Image
              src="/logo-horizontal.svg"
              alt="KidTube"
              width={140}
              height={36}
              priority
              className="h-8 md:h-9 w-auto"
            />
          </Link>
        </div>

        {/* Center: Search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <form id="search-form" action="/search" method="GET" className="relative w-full" data-tour="search">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="search-input"
              type="search"
              name="q"
              placeholder="جستجو..."
              className="w-full h-10 pr-10 pl-12 bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-full text-sm font-medium focus:border-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-light)] transition-all"
              dir="rtl"
            />
            <div className="absolute left-1 top-1/2 -translate-y-1/2">
              <VoiceSearchButton />
            </div>
          </form>
        </div>

        {/* Left side (RTL): User avatar or login */}
        <div className="flex items-center gap-2">
          {user && userEmail ? (
            <>
              <NotificationBell />
              <ProfileDropdown email={userEmail} />
            </>
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
