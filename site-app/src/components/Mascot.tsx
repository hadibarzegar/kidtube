import React from 'react'

export type MascotState = 'waving' | 'sleeping' | 'celebrating' | 'pointing'

interface MascotProps {
  state: MascotState
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<string, string> = {
  sm: 'text-4xl',
  md: 'text-6xl',
  lg: 'text-8xl',
}

const animations: Record<MascotState, string> = {
  waving: 'mascot-wave',
  sleeping: 'mascot-breathe',
  celebrating: 'mascot-bounce',
  pointing: 'mascot-bob',
}

export default function Mascot({ state, size = 'md' }: MascotProps) {
  const sizeClass = sizeClasses[size]
  const animName = animations[state]

  return (
    <div className={`inline-flex flex-col items-center ${sizeClass}`}>
      <style>{`
        @keyframes mascot-wave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes mascot-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes mascot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes mascot-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <span style={{ animation: `${animName} 2s ease-in-out infinite`, display: 'inline-block' }}>🦉</span>
      {state === 'sleeping' && (
        <span className="text-sm text-[var(--color-text-muted)] animate-pulse">💤</span>
      )}
    </div>
  )
}
