'use client'

import { useState, useEffect } from 'react'
import type { AvatarConfig } from '@/lib/types'
import { isLegacyAvatar, validateAvatarConfig } from '@/lib/avatar-config'
import { authFetch } from '@/lib/api'
import AvatarCompanion from './AvatarCompanion'

interface ActiveChildData {
  id: string
  avatar: AvatarConfig
}

export default function AvatarCompanionWrapper() {
  const [activeChild, setActiveChild] = useState<ActiveChildData | null>(null)

  useEffect(() => {
    async function fetchActiveChild() {
      try {
        const res = await authFetch('/me')
        if (!res.ok) return
        const data = await res.json()

        if (!data.active_child_id || !data.child_profiles) return

        const child = data.child_profiles.find(
          (c: { id: string }) => c.id === data.active_child_id
        )
        if (!child) return

        // Only show companion for new AvatarConfig avatars, not legacy emoji strings
        if (isLegacyAvatar(child.avatar)) return

        setActiveChild({
          id: child.id,
          avatar: validateAvatarConfig(child.avatar),
        })
      } catch { /* not logged in or backend unreachable */ }
    }

    fetchActiveChild()
  }, [])

  if (!activeChild) return null

  return (
    <AvatarCompanion
      config={activeChild.avatar}
      childId={activeChild.id}
    />
  )
}
