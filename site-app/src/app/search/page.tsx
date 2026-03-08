import { Suspense } from 'react'
import SearchOverlay from '@/components/SearchOverlay'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser } from '@/lib/types'

export default async function SearchPage() {
  let maxMaturity: string | undefined

  const user = await getCurrentUser()
  if (user) {
    const token = await getSiteSession()
    if (token) {
      const meRes = await apiServerAuthFetch('/me', token)
      if (meRes.ok) {
        const meData: SiteUser = await meRes.json()
        if (meData.active_child_id && meData.child_profiles) {
          const activeChild = meData.child_profiles.find((c) => c.id === meData.active_child_id)
          if (activeChild && activeChild.maturity_level && activeChild.maturity_level !== 'all-ages') {
            maxMaturity = activeChild.maturity_level
          }
        }
      }
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)]" />}>
      <SearchOverlay maxMaturity={maxMaturity} />
    </Suspense>
  )
}
