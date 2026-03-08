'use client'

interface BadgeCardProps {
  badgeType: string
  earnedAt: string
}

const BADGE_INFO: Record<string, { emoji: string; label: string }> = {
  first_video: { emoji: '🎬', label: 'اولین ویدیو' },
  streak_3: { emoji: '🔥', label: '۳ روز پیاپی' },
  streak_7: { emoji: '🔥', label: '۷ روز پیاپی' },
  streak_30: { emoji: '🔥', label: '۳۰ روز پیاپی' },
  watched_10: { emoji: '🌟', label: '۱۰ ویدیو' },
  watched_50: { emoji: '⭐', label: '۵۰ ویدیو' },
  watched_100: { emoji: '🏆', label: '۱۰۰ ویدیو' },
  explorer: { emoji: '🧭', label: 'کاشف' },
  bookworm: { emoji: '📚', label: 'کتابخوان' },
}

export default function BadgeCard({ badgeType, earnedAt }: BadgeCardProps) {
  const info = BADGE_INFO[badgeType] ?? { emoji: '🏅', label: badgeType }

  const formattedDate = new Date(earnedAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-4 text-center">
      <span className="text-3xl block mb-2" role="img" aria-label={info.label}>
        {info.emoji}
      </span>
      <span className="text-sm font-bold text-[var(--color-text)] block mb-1">
        {info.label}
      </span>
      <span className="text-xs text-[var(--color-text-muted)] block">
        {formattedDate}
      </span>
    </div>
  )
}
