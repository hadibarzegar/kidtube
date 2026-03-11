'use client'

import { useState, useRef, useCallback } from 'react'
import { authFetch } from '@/lib/api'

interface SubscribeButtonProps {
  channelId: string
  initialSubscribed: boolean
}

interface Confetti {
  id: number
  cx: number
  cy: number
  cr: string
  color: string
  shape: 'circle' | 'rect'
}

const CONFETTI_COLORS = ['#FF8A7A', '#FFD166', '#7EC8E3', '#C4A8E0', '#7ED6A8', '#FFB3D9']

export default function SubscribeButton({ channelId, initialSubscribed }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)
  const [confetti, setConfetti] = useState<Confetti[]>([])
  const nextId = useRef(0)

  const spawnConfetti = useCallback(() => {
    const pieces: Confetti[] = Array.from({ length: 12 }, () => {
      const angle = Math.random() * Math.PI * 2
      const distance = 30 + Math.random() * 40
      return {
        id: nextId.current++,
        cx: Math.cos(angle) * distance,
        cy: Math.sin(angle) * distance - 20,
        cr: `${Math.random() * 720 - 360}deg`,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
      }
    })
    setConfetti(pieces)
    setTimeout(() => setConfetti([]), 800)
  }, [])

  async function handleClick() {
    if (loading) return
    setLoading(true)

    const wasSubscribed = subscribed
    setSubscribed(!wasSubscribed)

    if (!wasSubscribed) {
      spawnConfetti()
    }

    try {
      const method = wasSubscribed ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/subscriptions/${channelId}`, { method })

      if (res.status === 401) {
        setSubscribed(wasSubscribed)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        setSubscribed(wasSubscribed)
      }
    } catch {
      setSubscribed(wasSubscribed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={[
        'relative h-10 px-5 rounded-full text-sm font-semibold transition-all duration-200 overflow-visible',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95',
        subscribed
          ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[2px] border-[var(--color-border)] hover:bg-[var(--color-border)]'
          : 'bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-80',
      ].join(' ')}
    >
      {/* Confetti burst */}
      {confetti.map((c) => (
        <span
          key={c.id}
          className="absolute pointer-events-none left-1/2 top-1/2"
          style={{
            '--cx': `${c.cx}px`,
            '--cy': `${c.cy}px`,
            '--cr': c.cr,
            animation: 'kidtube-confetti 800ms cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          } as React.CSSProperties}
        >
          {c.shape === 'circle' ? (
            <svg width="8" height="8" viewBox="0 0 8 8" fill={c.color}>
              <circle cx="4" cy="4" r="4" />
            </svg>
          ) : (
            <svg width="8" height="6" viewBox="0 0 8 6" fill={c.color}>
              <rect width="8" height="6" rx="1" />
            </svg>
          )}
        </span>
      ))}
      {subscribed ? 'عضو شدید ✓' : 'عضویت'}
    </button>
  )
}
