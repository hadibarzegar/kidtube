'use client'

import { useEffect, useState } from 'react'

interface CountdownOverlayProps {
  nextEpisode: { id: string; title: string; order: number }
  onCancel: () => void
  onProceed: () => void
}

const TOTAL_SECONDS = 7

export default function CountdownOverlay({ nextEpisode, onCancel, onProceed }: CountdownOverlayProps) {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)

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

  // SVG circle progress
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = ((TOTAL_SECONDS - seconds) / TOTAL_SECONDS) * circumference

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 rounded-[20px]" dir="rtl">
      <div
        className="bg-[var(--color-surface)] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 text-center border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow-hover)] max-w-sm mx-4 animate-[kidtube-slide-up_400ms_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* Circular countdown */}
        <div className="flex justify-center mb-4">
          <div
            className="relative w-20 h-20 rounded-full"
            style={{
              animation: seconds <= 3 ? 'kidtube-pulse-glow 1s ease-in-out infinite' : undefined,
            }}
          >
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40" cy="40" r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="5"
              />
              {/* Progress circle */}
              <circle
                cx="40" cy="40" r={radius}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            {/* Countdown number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-2xl font-bold text-[var(--color-primary)]"
                style={{ animation: 'kidtube-heart-pop 300ms cubic-bezier(0.34,1.56,0.64,1)' }}
                key={seconds}
              >
                {seconds}
              </span>
            </div>
          </div>
        </div>

        {/* Next episode info */}
        <p className="text-sm text-[var(--color-text-muted)] mb-1">قسمت بعدی</p>
        <p className="font-bold text-lg text-[var(--color-text)] mb-0.5 leading-tight">{nextEpisode.title}</p>
        <p className="text-xs text-[var(--color-text-faint)] mb-5">
          قسمت {nextEpisode.order}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-2xl font-medium min-h-[48px] cursor-pointer transition-all duration-200 [transition-timing-function:var(--clay-bounce)] hover:border-[var(--color-primary-light)] hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.97] text-[var(--color-text)]"
          >
            لغو
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-3 bg-[var(--color-primary)] text-white border-[3px] border-[var(--color-primary-dark)] rounded-2xl font-medium min-h-[48px] cursor-pointer shadow-[var(--clay-shadow)] transition-all duration-200 [transition-timing-function:var(--clay-bounce)] hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow-hover)] active:translate-y-[1px] active:scale-[0.97]"
            style={{ animation: 'kidtube-btn-bounce 1.5s ease-in-out infinite' }}
          >
            پخش کن
          </button>
        </div>
      </div>
    </div>
  )
}
