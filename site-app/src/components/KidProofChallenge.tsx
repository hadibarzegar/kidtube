'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const PERSIAN_NUMBERS: Record<number, string> = {
  0: 'صفر',
  1: 'یک',
  2: 'دو',
  3: 'سه',
  4: 'چهار',
  5: 'پنج',
  6: 'شش',
  7: 'هفت',
  8: 'هشت',
  9: 'نه',
}

interface KidProofChallengeProps {
  onSuccess: () => void
  onCancel: () => void
}

function generateDigits(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10))
}

export default function KidProofChallenge({ onSuccess, onCancel }: KidProofChallengeProps) {
  const [digits] = useState<number[]>(generateDigits)
  const [values, setValues] = useState<string[]>(['', '', '', ''])
  const [error, setError] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = useCallback(
    (index: number, value: string) => {
      const cleaned = value.replace(/\D/g, '').slice(-1)
      const next = [...values]
      next[index] = cleaned
      setValues(next)
      setError(false)

      if (cleaned && index < 3) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [values],
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !values[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [values],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const entered = values.map(Number)
    if (entered.every((v, i) => v === digits[i]) && values.every((v) => v !== '')) {
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 max-w-sm w-full mx-4">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-6 text-center">
          این اعداد را تایپ کنید
        </h2>

        {/* Display Persian words */}
        <div className="flex justify-center gap-3 mb-6">
          {digits.map((d, i) => (
            <span
              key={i}
              className="text-2xl font-bold text-[var(--color-primary)]"
            >
              {PERSIAN_NUMBERS[d]}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          {/* Digit input boxes */}
          <div className="flex gap-3" dir="ltr">
            {values.map((val, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-12 text-center clay-input text-xl font-bold transition-all duration-200 ${
                  error
                    ? 'border-[var(--color-error)] animate-[shake_0.3s_ease-in-out]'
                    : ''
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 text-center">
              اعداد وارد شده اشتباه است
            </p>
          )}

          <div className="flex gap-3 w-full">
            <button
              type="submit"
              className="flex-1 bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 cursor-pointer"
            >
              تأیید
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

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
        }
      `}</style>
    </div>
  )
}
