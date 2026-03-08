'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/api'
import Mascot from './Mascot'

interface TimeLockOverlayProps {
  childId: string
}

export default function TimeLockOverlay({ childId }: TimeLockOverlayProps) {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (pin.length < 4 || pin.length > 6) {
      setError('رمز باید بین ۴ تا ۶ رقم باشد')
      return
    }

    setLoading(true)
    try {
      const res = await authFetch('/me/children/deactivate', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      })

      if (!res.ok) {
        setError('رمز والدین اشتباه است')
        return
      }

      router.refresh()
      router.push('/profiles')
    } catch {
      setError('اتصال به سرور برقرار نشد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 w-full max-w-sm text-center">
        {/* Sleeping mascot */}
        <div className="mb-6">
          <Mascot state="sleeping" size="lg" />
        </div>

        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
          زمان تماشا تمام شد!
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          برای ادامه، والدین باید رمز خود را وارد کنند
        </p>

        <form onSubmit={handleUnlock} className="flex flex-col gap-4">
          <div>
            <label htmlFor="unlock_pin" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              رمز والدین
            </label>
            <input
              id="unlock_pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full clay-input px-4 py-2.5 text-sm text-center tracking-[0.5em]"
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'در حال بررسی...' : 'باز کردن قفل'}
          </button>
        </form>
      </div>
    </div>
  )
}
