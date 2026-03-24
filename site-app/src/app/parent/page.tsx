import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser, ChildProfile } from '@/lib/types'
import { isLegacyAvatar, LEGACY_AVATAR_EMOJIS } from '@/lib/avatar-config'

export const metadata = {
  title: 'کنترل والدین — KidTube',
}

export default async function ParentDashboardPage() {
  const token = await getSiteSession()
  if (!token) {
    redirect('/login')
  }

  let user: SiteUser | null = null
  const res = await apiServerAuthFetch('/me', token, { cache: 'no-store' })
  if (res.ok) {
    user = await res.json()
  } else {
    redirect('/login')
  }

  const children: ChildProfile[] = user?.child_profiles ?? []

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">کنترل والدین</h1>
        <p className="text-[var(--color-text-muted)] text-sm mb-8">
          تنظیمات هر کودک را مدیریت کنید
        </p>

        {children.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-muted)]">
            <span className="text-6xl mb-4">👶</span>
            <p className="text-lg font-medium mb-2">هنوز پروفایل کودکی ایجاد نکرده‌اید</p>
            <Link
              href="/profiles"
              className="mt-4 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium text-sm transition-colors no-underline"
            >
              ایجاد پروفایل کودک
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/parent/${child.id}`}
                className="flex flex-col items-center gap-3 p-6 rounded-[20px] border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] hover:border-[var(--color-primary)] transition-all duration-200 no-underline"
              >
                <span className="text-5xl" role="img" aria-label={isLegacyAvatar(child.avatar) ? child.avatar : child.name}>
                  {isLegacyAvatar(child.avatar) ? (LEGACY_AVATAR_EMOJIS[child.avatar] ?? '⭐') : '🧑'}
                </span>
                <span className="text-base font-bold text-[var(--color-text)]">{child.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{child.age} ساله</span>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-1">
                  <span>
                    محدودیت زمانی:{' '}
                    {child.screen_time_limit_min > 0
                      ? `${child.screen_time_limit_min} دقیقه`
                      : 'نامحدود'}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-primary)] font-medium mt-2">
                  مدیریت تنظیمات ←
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
