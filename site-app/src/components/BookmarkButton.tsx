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
        'flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:bg-[var(--color-border)]',
        bookmarked
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-text)]',
      ].join(' ')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <span>{bookmarked ? 'ذخیره شده' : 'ذخیره'}</span>
    </button>
  )
}
