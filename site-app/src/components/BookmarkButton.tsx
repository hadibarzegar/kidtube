'use client'

import { useState, useRef, useCallback } from 'react'
import { authFetch } from '@/lib/api'

interface BookmarkButtonProps {
  episodeId: string
  initialBookmarked: boolean
}

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  color: string
}

const SPARKLE_COLORS = ['#FFD166', '#FF8A7A', '#7EC8E3', '#C4A8E0']

export default function BookmarkButton({ episodeId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const nextId = useRef(0)

  const spawnSparkles = useCallback(() => {
    const newSparkles: Sparkle[] = Array.from({ length: 6 }, () => ({
      id: nextId.current++,
      x: -10 + Math.random() * 20,
      y: -15 + Math.random() * 10,
      size: 6 + Math.random() * 6,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    }))
    setSparkles(newSparkles)
    setTimeout(() => setSparkles([]), 700)
  }, [])

  async function handleClick() {
    if (loading) return
    setLoading(true)

    const wasBookmarked = bookmarked
    setBookmarked(!wasBookmarked)

    if (!wasBookmarked) {
      setAnimating(true)
      spawnSparkles()
      setTimeout(() => setAnimating(false), 500)
    }

    try {
      const method = wasBookmarked ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/bookmarks/${episodeId}`, { method })

      if (res.status === 401) {
        setBookmarked(wasBookmarked)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        setBookmarked(wasBookmarked)
      }
    } catch {
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
        'relative flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-all duration-200',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:bg-[var(--color-border)]',
        bookmarked
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-text)]',
      ].join(' ')}
    >
      {/* Sparkles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${s.x}px)`,
            top: `calc(50% + ${s.y}px)`,
            animation: 'kidtube-sparkle 700ms ease-out forwards',
          }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 12 12" fill={s.color}>
            <path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12 4.5 7.5 0 6l4.5-1.5z" />
          </svg>
        </span>
      ))}

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        style={animating ? { animation: 'kidtube-heart-pop 500ms cubic-bezier(0.34,1.56,0.64,1)' } : undefined}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <span>{bookmarked ? 'ذخیره شده' : 'ذخیره'}</span>
    </button>
  )
}
