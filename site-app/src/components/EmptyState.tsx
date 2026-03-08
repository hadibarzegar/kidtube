import React from 'react'
import Mascot from './Mascot'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4">
        <Mascot state="pointing" size="md" />
      </div>
      {icon && (
        <div className="text-5xl mb-4 text-[var(--color-text-faint)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-[var(--color-text-muted)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-faint)] max-w-xs mb-6">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 no-underline"
        >
          {actionLabel}
        </a>
      )}
    </div>
  )
}
