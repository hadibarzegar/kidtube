import React from 'react'
import Mascot, { type MascotState } from './Mascot'

interface MascotBubbleProps {
  state: MascotState
  message: string
  size?: 'sm' | 'md' | 'lg'
}

export default function MascotBubble({ state, message, size = 'md' }: MascotBubbleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Mascot state={state} size={size} />
      <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] px-4 py-2 max-w-xs text-center">
        <p className="text-sm font-medium text-[var(--color-text)]">{message}</p>
      </div>
    </div>
  )
}
