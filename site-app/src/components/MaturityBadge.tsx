interface MaturityBadgeProps {
  rating: string
}

const RATING_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  'all-ages': {
    label: 'همه سنین',
    bg: 'bg-[var(--color-mint)]',
    text: 'text-white',
  },
  '6+': {
    label: '۶+',
    bg: 'bg-[var(--color-secondary)]',
    text: 'text-white',
  },
  '9+': {
    label: '۹+',
    bg: 'bg-[var(--color-yellow)]',
    text: 'text-[var(--color-text)]',
  },
  '12+': {
    label: '۱۲+',
    bg: 'bg-[var(--color-primary)]',
    text: 'text-white',
  },
}

export default function MaturityBadge({ rating }: MaturityBadgeProps) {
  const config = RATING_CONFIG[rating]
  if (!config) return null

  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}
