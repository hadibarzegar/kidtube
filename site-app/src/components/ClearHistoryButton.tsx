'use client'

import { authFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ClearHistoryButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClear() {
    if (!confirm('آیا مطمئنید؟')) return

    setLoading(true)
    try {
      await authFetch('/me/watch-history', { method: 'DELETE' })
      router.refresh()
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className="clay-btn px-4 py-2 text-sm font-medium text-[var(--color-danger)] bg-[var(--color-surface)] hover:bg-[var(--color-danger)] hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'پاک کردن تاریخچه'}
    </button>
  )
}
