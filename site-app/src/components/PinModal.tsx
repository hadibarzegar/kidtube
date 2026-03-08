'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface PinModalProps {
  onVerified: (pin: string) => void
  onClose: () => void
  mode: 'verify' | 'set'
}

export default function PinModal({ onVerified, onClose, mode }: PinModalProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (pin.length < 4 || pin.length > 6) {
      setError('رمز باید بین ۴ تا ۶ رقم باشد')
      return
    }

    if (mode === 'set') {
      if (pin !== confirmPin) {
        setError('رمزها یکسان نیستند')
        return
      }

      setLoading(true)
      try {
        const res = await authFetch('/me/pin', {
          method: 'POST',
          body: JSON.stringify({ pin }),
        })
        if (!res.ok) {
          setError('تنظیم رمز ناموفق بود')
          return
        }
        onVerified(pin)
      } catch {
        setError('اتصال به سرور برقرار نشد')
      } finally {
        setLoading(false)
      }
    } else {
      onVerified(pin)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 text-center">
          {mode === 'set' ? 'تنظیم رمز' : 'رمز والدین'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              {mode === 'set' ? 'رمز جدید' : 'رمز والدین'}
            </label>
            <input
              id="pin"
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

          {mode === 'set' && (
            <div>
              <label htmlFor="confirm_pin" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                تأیید رمز
              </label>
              <input
                id="confirm_pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full clay-input px-4 py-2.5 text-sm text-center tracking-[0.5em]"
                placeholder="••••"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 text-center">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'در حال بررسی...' : mode === 'set' ? 'تنظیم رمز' : 'تأیید'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--color-surface)] text-[var(--color-text)] rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] transition-all duration-200 cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
