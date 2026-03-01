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
        'min-h-[44px] px-6 rounded-full font-medium transition-colors',
        subscribed
          ? 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
          : 'bg-blue-500 text-white hover:bg-blue-600',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {subscribed ? 'عضو هستید' : 'عضویت'}
    </button>
  )
}
