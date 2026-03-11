'use client'

interface BadgeCardProps {
  badgeType: string
  earnedAt: string
  index?: number
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

export default function BadgeCard({ badgeType, earnedAt, index = 0 }: BadgeCardProps) {
  const info = BADGE_INFO[badgeType] ?? { emoji: '🏅', label: badgeType }

  const formattedDate = new Date(earnedAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className="relative overflow-hidden bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[2px] sm:border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-3 sm:p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--clay-shadow-hover)]"
      style={{
        opacity: 0,
        animation: `kidtube-badge-pop 600ms cubic-bezier(0.34,1.56,0.64,1) ${index * 100}ms forwards`,
      }}
    >
      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          width: '60%',
          animation: 'kidtube-shimmer 3s ease-in-out infinite',
          animationDelay: `${index * 200}ms`,
        }}
      />
      <span
        className="text-2xl sm:text-3xl block mb-1.5 sm:mb-2"
        role="img"
        aria-label={info.label}
        style={{ display: 'inline-block', animation: 'kidtube-float 3s ease-in-out infinite' }}
      >
        {info.emoji}
      </span>
      <span className="text-xs sm:text-sm font-bold text-[var(--color-text)] block mb-0.5 sm:mb-1">
        {info.label}
      </span>
      <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] block">
        {formattedDate}
      </span>
    </div>
  )
}
