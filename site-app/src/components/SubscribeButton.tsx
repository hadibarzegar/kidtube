'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface SubscribeButtonProps {
  channelId: string
  initialSubscribed: boolean
}

export default function SubscribeButton({ channelId, initialSubscribed }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)

    // Optimistic update
    const wasSubscribed = subscribed
    setSubscribed(!wasSubscribed)

    try {
      const method = wasSubscribed ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/subscriptions/${channelId}`, { method })

      if (res.status === 401) {
        // Guest — revert optimistic update and redirect to login
        setSubscribed(wasSubscribed)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        // Unexpected error — revert optimistic update
        setSubscribed(wasSubscribed)
      }
      // 201, 200, or 409 (already subscribed) — keep the optimistic state
    } catch {
      // Network error — revert optimistic update
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
        'h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95',
        subscribed
          ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[2px] border-[var(--color-border)] hover:bg-[var(--color-border)]'
          : 'bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-80',
      ].join(' ')}
    >
      {subscribed ? 'عضو شدید ✓' : 'عضویت'}
    </button>
  )
}
