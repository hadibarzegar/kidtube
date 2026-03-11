'use client'

import { useState, useEffect } from 'react'

interface StreakCounterProps {
  currentStreak: number
}

export default function StreakCounter({ currentStreak }: StreakCounterProps) {
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    if (currentStreak <= 0) return
    let current = 0
    const step = Math.max(1, Math.floor(currentStreak / 15))
    const interval = setInterval(() => {
      current += step
      if (current >= currentStreak) {
        current = currentStreak
        clearInterval(interval)
      }
      setDisplayCount(current)
    }, 50)
    return () => clearInterval(interval)
  }, [currentStreak])

  if (currentStreak <= 0) return null

  return (
    <span
      className="inline-flex items-center gap-1 sm:gap-1.5 bg-[var(--color-surface)] rounded-full border-[2px] sm:border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] px-2.5 sm:px-3 py-1 sm:py-1.5"
      style={{ animation: 'kidtube-card-enter 500ms cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <span
        className="text-lg inline-block"
        role="img"
        aria-label="streak"
        style={{ animation: 'kidtube-fire-flicker 800ms ease-in-out infinite' }}
      >
        🔥
      </span>
      <span className="text-sm font-bold text-[var(--color-text)]">
        {displayCount.toLocaleString('fa-IR')} روز پیاپی
      </span>
    </span>
  )
}
