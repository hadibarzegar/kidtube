'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface LikeButtonProps {
  episodeId: string
  initialLiked: boolean
  initialLikeCount: number
}

export default function LikeButton({ episodeId, initialLiked, initialLikeCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)

    const wasLiked = liked
    const prevCount = likeCount
    // Optimistic update
    setLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)

    try {
      const method = wasLiked ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/likes/${episodeId}`, { method })

      if (res.status === 401) {
        setLiked(wasLiked)
        setLikeCount(prevCount)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        setLiked(wasLiked)
        setLikeCount(prevCount)
      }
    } catch {
      setLiked(wasLiked)
      setLikeCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? 'برداشتن پسند' : 'پسندیدن'}
      className={[
        'flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:bg-[var(--color-border)]',
        liked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]',
      ].join(' ')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      {likeCount > 0 && <span>{likeCount.toLocaleString('fa-IR')}</span>}
    </button>
  )
}
