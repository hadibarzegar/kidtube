import { redirect } from 'next/navigation'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser } from '@/lib/types'
import ProfilePicker from '@/components/ProfilePicker'
import BadgeCard from '@/components/BadgeCard'

export const metadata = {
  title: 'انتخاب پروفایل — KidTube',
}

export default async function ProfilesPage() {
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

  const children = user?.child_profiles ?? []
  const activeChildId = user?.active_child_id ?? null

  // Check if user has a PIN set by looking for the has_pin field
  // We'll assume the /me endpoint returns this info or default to false
  const hasPIN = !!(user as unknown as Record<string, unknown>)?.has_pin

  // Fetch badges for active child
  interface Badge {
    badge_type: string
    earned_at: string
  }
  let badges: Badge[] = []
  if (activeChildId) {
    const badgesRes = await apiServerAuthFetch(
      `/me/children/${activeChildId}/badges`,
      token,
      { cache: 'no-store' }
    )
    if (badgesRes.ok) {
      badges = await badgesRes.json()
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--color-text)] text-center mb-2">
          چه کسی تماشا می‌کند؟
        </h1>
        <p className="text-center text-[var(--color-text-muted)] mb-10">
          یک پروفایل را انتخاب کنید
        </p>

        <ProfilePicker
          children={children}
          activeChildId={activeChildId}
          hasPIN={hasPIN}
        />

        {/* Badges section */}
        {activeChildId && badges.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[var(--color-text)] text-center mb-6">
              نشان‌های کسب شده
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <BadgeCard
                  key={badge.badge_type}
                  badgeType={badge.badge_type}
                  earnedAt={badge.earned_at}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
