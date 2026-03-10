'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SleepTimerProps {
  onSleep: () => void
}

const PRESETS = [
  { label: '۱۵ دقیقه', minutes: 15 },
  { label: '۳۰ دقیقه', minutes: 30 },
  { label: '۴۵ دقیقه', minutes: 45 },
  { label: '۶۰ دقیقه', minutes: 60 },
] as const

export default function SleepTimer({ onSleep }: SleepTimerProps) {
  const [open, setOpen] = useState(false)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRemainingMs(null)
  }, [])

  const startTimer = useCallback((minutes: number) => {
    clearTimer()
    endTimeRef.current = Date.now() + minutes * 60 * 1000
    setRemainingMs(minutes * 60 * 1000)
    setOpen(false)

    timerRef.current = setInterval(() => {
      const left = endTimeRef.current - Date.now()
      if (left <= 0) {
        clearTimer()
        onSleep()
      } else {
        setRemainingMs(left)
      }
    }, 1000)
  }, [clearTimer, onSleep])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      .replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
  }

  return (
    <div className="relative" dir="rtl">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
        aria-label="تایمر خواب"
        title="تایمر خواب"
      >
        {remainingMs ? (
          <span className="text-[10px] font-bold leading-none">{formatTime(remainingMs)}</span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-40 w-44 p-3 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[var(--color-text)]">تایمر خواب</span>
            <button
              onClick={() => setOpen(false)}
              className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-xs hover:bg-black/20"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => startTimer(p.minutes)}
                className="w-full text-right py-1.5 px-2 rounded-lg hover:bg-[var(--color-primary-hover)] text-[var(--color-text)] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
          {remainingMs && (
            <button
              onClick={clearTimer}
              className="w-full mt-2 py-1.5 px-2 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] text-center font-medium cursor-pointer hover:bg-[var(--color-error)]/20 transition-colors"
            >
              لغو تایمر
            </button>
          )}
        </div>
      )}
    </div>
  )
}
