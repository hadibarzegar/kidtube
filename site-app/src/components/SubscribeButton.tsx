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
        'min-h-[44px] px-6 rounded-2xl font-medium border-[3px] transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow-hover)] active:translate-y-[1px] active:scale-[0.97]',
        subscribed
          ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
          : 'bg-[var(--color-primary)] text-white border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)]',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {subscribed ? 'عضو هستید' : 'عضویت'}
    </button>
  )
}
