'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface BlockEpisodeButtonProps {
  episodeId: string
  childId: string | null
}

export default function BlockEpisodeButton({ episodeId, childId }: BlockEpisodeButtonProps) {
  const [loading, setLoading] = useState(false)

  if (!childId) return null

  async function handleBlock() {
    const confirmed = window.confirm('این ویدیو برای این پروفایل مسدود شود؟')
    if (!confirmed) return

    setLoading(true)
    try {
      const res = await authFetch(`/me/children/${childId}/blocked-episodes`, {
        method: 'POST',
        body: JSON.stringify({ episode_id: episodeId }),
      })

      if (!res.ok) {
        alert('مسدود کردن ویدیو ناموفق بود')
        return
      }

      window.location.href = '/'
    } catch {
      alert('اتصال به سرور برقرار نشد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="h-9 w-9 rounded-full flex items-center justify-center bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors cursor-pointer disabled:opacity-50"
      title="مسدود کردن ویدیو"
      aria-label="مسدود کردن ویدیو"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    </button>
  )
}
