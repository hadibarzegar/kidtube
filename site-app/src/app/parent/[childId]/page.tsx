import { redirect } from 'next/navigation'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser, ChildProfile, ChannelRule } from '@/lib/types'
import ParentalControlsClient from '@/components/ParentalControlsClient'
import { isLegacyAvatar, LEGACY_AVATAR_EMOJIS } from '@/lib/avatar-config'

interface PageProps {
  params: Promise<{ childId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { childId } = await params
  const token = await getSiteSession()
  if (!token) return { title: 'کنترل والدین — KidTube' }

  const res = await apiServerAuthFetch('/me', token, { cache: 'no-store' })
  if (!res.ok) return { title: 'کنترل والدین — KidTube' }

  const user: SiteUser = await res.json()
  const child = user.child_profiles?.find((c) => c.id === childId)
  return {
    title: child ? `تنظیمات ${child.name} — KidTube` : 'کنترل والدین — KidTube',
  }
}

export default async function ChildControlsPage({ params }: PageProps) {
  const { childId } = await params
  const token = await getSiteSession()
  if (!token) {
    redirect('/login')
  }

  // Fetch user data to find the child
  const userRes = await apiServerAuthFetch('/me', token, { cache: 'no-store' })
  if (!userRes.ok) {
    redirect('/login')
  }
  const user: SiteUser = await userRes.json()
  const child = user.child_profiles?.find((c) => c.id === childId)
  if (!child) {
    redirect('/parent')
  }

  // Fetch channel rules for this child
  let rules: ChannelRule[] = []
  const rulesRes = await apiServerAuthFetch(`/me/children/${childId}/channel-rules`, token, {
    cache: 'no-store',
  })
  if (rulesRes.ok) {
    rules = await rulesRes.json()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Child info header */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-5xl" role="img" aria-label={isLegacyAvatar(child.avatar) ? child.avatar : child.name}>
            {isLegacyAvatar(child.avatar) ? (LEGACY_AVATAR_EMOJIS[child.avatar] ?? '⭐') : '🧑'}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              تنظیمات {child.name}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">{child.age} ساله</p>
          </div>
        </div>

        <ParentalControlsClient
          childId={childId}
          child={child}
          initialRules={rules}
        />
      </div>
    </div>
  )
}
