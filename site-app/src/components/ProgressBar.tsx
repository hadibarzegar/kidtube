interface ProgressBarProps {
  progressPct: number
}

export default function ProgressBar({ progressPct }: ProgressBarProps) {
  if (progressPct <= 0) return null

  return (
    <div
      className="absolute bottom-0 left-0 h-[3px] rounded-b-[var(--clay-radius)]"
      style={{
        width: `${progressPct * 100}%`,
        backgroundColor: 'var(--color-primary)',
      }}
    />
  )
}
