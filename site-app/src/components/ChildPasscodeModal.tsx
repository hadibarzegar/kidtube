'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface ChildPasscodeModalProps {
  childId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ChildPasscodeModal({ childId, onSuccess, onCancel }: ChildPasscodeModalProps) {
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (passcode.length !== 4) {
      setError('\u0631\u0645\u0632 \u0628\u0627\u06CC\u062F \u06F4 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F')
      return
    }

    setLoading(true)
    try {
      const res = await authFetch(`/me/children/${childId}/verify-passcode`, {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      })
      if (res.ok) {
        onSuccess()
      } else if (res.status === 401) {
        setError('\u0631\u0645\u0632 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A')
      } else {
        setError('\u062E\u0637\u0627\u06CC\u06CC \u0631\u062E \u062F\u0627\u062F')
      }
    } catch {
      setError('\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u0633\u0631\u0648\u0631 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 text-center">
          رمز پروفایل را وارد کنید
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              className="w-full clay-input px-4 py-2.5 text-sm text-center tracking-[0.5em]"
              placeholder="••••"
              autoFocus
            />
          </div>

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
              {loading ? 'در حال بررسی...' : 'تأیید'}
            </button>
            <button
              type="button"
              onClick={onCancel}
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
