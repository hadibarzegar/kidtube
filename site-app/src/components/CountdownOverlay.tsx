'use client'

import { useEffect, useState } from 'react'

interface CountdownOverlayProps {
  nextEpisode: { id: string; title: string; order: number }
  onCancel: () => void
  onProceed: () => void
}

export default function CountdownOverlay({ nextEpisode, onCancel, onProceed }: CountdownOverlayProps) {
  const [seconds, setSeconds] = useState(7)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onProceed()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onProceed])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-[20px]">
      <div className="bg-[var(--color-surface)] rounded-[20px] p-6 text-center border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] max-w-xs mx-4" dir="rtl">
        <p className="text-sm text-[var(--color-text-muted)] mb-2">قسمت بعدی در {seconds} ثانیه</p>
        <p className="font-bold text-lg text-[var(--color-text)] mb-1">{nextEpisode.title}</p>
        <p className="text-sm text-[var(--color-text-faint)] mb-4">قسمت {nextEpisode.order}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-2xl font-medium min-h-[48px] cursor-pointer transition-all duration-200 hover:border-[var(--color-primary-light)] text-[var(--color-text)]"
          >
            لغو
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-3 bg-[var(--color-primary)] text-white border-[3px] border-[var(--color-primary-dark)] rounded-2xl font-medium min-h-[48px] cursor-pointer shadow-[var(--clay-shadow)] transition-all duration-200 hover:-translate-y-0.5"
          >
            پخش
          </button>
        </div>
      </div>
    </div>
  )
}
