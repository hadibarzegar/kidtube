'use client'

interface StreakCounterProps {
  currentStreak: number
}

export default function StreakCounter({ currentStreak }: StreakCounterProps) {
  if (currentStreak <= 0) return null

  return (
    <span className="inline-flex items-center gap-1.5 bg-[var(--color-surface)] rounded-full border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] px-3 py-1.5">
      <span className="text-lg" role="img" aria-label="streak">
        🔥
      </span>
      <span className="text-sm font-bold text-[var(--color-text)]">
        {currentStreak.toLocaleString('fa-IR')} روز پیاپی
      </span>
    </span>
  )
}
