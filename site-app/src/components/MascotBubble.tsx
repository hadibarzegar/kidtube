import React from 'react'
import Mascot, { type MascotState } from './Mascot'

interface MascotBubbleProps {
  state: MascotState
  message: string
  size?: 'sm' | 'md' | 'lg'
}

export default function MascotBubble({ state, message, size = 'md' }: MascotBubbleProps) {
  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{ animation: 'kidtube-float 3s ease-in-out infinite' }}
    >
      <Mascot state={state} size={size} />
      <div
        className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] px-4 py-2 max-w-xs text-center"
        style={{
          opacity: 0,
          animation: 'kidtube-bubble-pop 500ms cubic-bezier(0.34,1.56,0.64,1) 300ms forwards',
        }}
      >
        <p className="text-sm font-medium text-[var(--color-text)]">{message}</p>
      </div>
    </div>
  )
}
