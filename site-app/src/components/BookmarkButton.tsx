'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface BookmarkButtonProps {
  episodeId: string
  initialBookmarked: boolean
}

export default function BookmarkButton({ episodeId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)

    // Optimistic update
    const wasBookmarked = bookmarked
    setBookmarked(!wasBookmarked)

    try {
      const method = wasBookmarked ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/bookmarks/${episodeId}`, { method })

      if (res.status === 401) {
        // Guest — revert optimistic update and redirect to login
        setBookmarked(wasBookmarked)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        // Unexpected error — revert optimistic update
        setBookmarked(wasBookmarked)
      }
      // 201, 200, or 409 — keep the optimistic state
    } catch {
      // Network error — revert optimistic update
      setBookmarked(wasBookmarked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={bookmarked ? 'حذف نشان' : 'نشان کردن'}
      className={[
        'p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
        bookmarked ? 'text-blue-500' : 'text-gray-600',
      ].join(' ')}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
