'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FeatureTooltipProps {
  targetSelector: string
  message: string
  position: 'top' | 'bottom' | 'left' | 'right'
  onNext: () => void
  onSkip: () => void
  stepNumber: number
  totalSteps: number
}

const toPersianDigits = (n: number): string =>
  n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)])

export default function FeatureTooltip({
  targetSelector,
  message,
  position,
  onNext,
  onSkip,
  stepNumber,
  totalSteps,
}: FeatureTooltipProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updateRect = useCallback(() => {
    const el = document.querySelector(targetSelector)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    }
  }, [targetSelector])

  useEffect(() => {
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [updateRect])

  // Measure tooltip after render to clamp within viewport
  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipRect(tooltipRef.current.getBoundingClientRect())
    }
  }, [targetRect, position])

  if (!targetRect) return null

  const padding = 6
  const highlightStyle: React.CSSProperties = {
    position: 'fixed',
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: '16px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
    border: '2px solid rgba(255,255,255,0.6)',
    zIndex: 101,
    pointerEvents: 'none',
  }

  // Position tooltip relative to target
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 102,
  }

  const gap = 16
  const margin = 12 // minimum distance from viewport edge
  switch (position) {
    case 'bottom':
      tooltipStyle.top = targetRect.bottom + padding + gap
      tooltipStyle.left = targetRect.left + targetRect.width / 2
      tooltipStyle.transform = 'translateX(-50%)'
      break
    case 'top':
      tooltipStyle.bottom = window.innerHeight - targetRect.top + padding + gap
      tooltipStyle.left = targetRect.left + targetRect.width / 2
      tooltipStyle.transform = 'translateX(-50%)'
      break
    case 'left':
      tooltipStyle.right = window.innerWidth - targetRect.left + padding + gap
      // Vertically center on target, but clamp to viewport
      {
        const tooltipH = tooltipRect?.height ?? 180
        let top = targetRect.top + targetRect.height / 2 - tooltipH / 2
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipH - margin))
        tooltipStyle.top = top
      }
      break
    case 'right':
      tooltipStyle.left = targetRect.right + padding + gap
      {
        const tooltipH = tooltipRect?.height ?? 180
        let top = targetRect.top + targetRect.height / 2 - tooltipH / 2
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipH - margin))
        tooltipStyle.top = top
      }
      break
  }

  // Horizontal clamping for bottom/top positions
  if ((position === 'bottom' || position === 'top') && tooltipRect) {
    const centerX = targetRect.left + targetRect.width / 2
    const halfW = tooltipRect.width / 2
    if (centerX - halfW < margin) {
      tooltipStyle.left = margin
      tooltipStyle.transform = position === 'bottom' || position === 'top' ? 'none' : tooltipStyle.transform
    } else if (centerX + halfW > window.innerWidth - margin) {
      tooltipStyle.left = undefined
      tooltipStyle.right = margin
      tooltipStyle.transform = 'none'
    }
  }

  return (
    <>
      {/* Full-screen overlay */}
      <div
        className="fixed inset-0 z-[100]"
        onClick={onSkip}
      />

      {/* Highlight cutout around target */}
      <div style={highlightStyle} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-white border-2 border-[var(--color-primary-light)] rounded-2xl p-0 shadow-lg shadow-[var(--color-primary)]/15 max-w-[300px] min-w-[240px] overflow-hidden"
        dir="rtl"
      >
        {/* Colored header strip */}
        <div className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦉</span>
            <span className="text-white text-xs font-bold">راهنمای کیدتیوب</span>
          </div>
          <span className="text-white/80 text-[10px] font-medium bg-white/20 rounded-full px-2 py-0.5">
            {toPersianDigits(stepNumber)}/{toPersianDigits(totalSteps)}
          </span>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-text)] leading-relaxed mb-3">
            {message}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < stepNumber
                    ? 'bg-[var(--color-primary)] w-4'
                    : 'bg-[var(--color-border)] w-1.5'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNext}
              className="text-xs px-5 py-2 rounded-full bg-[var(--color-primary)] text-white font-bold border-none cursor-pointer hover:brightness-110 transition-all shadow-sm"
            >
              {stepNumber === totalSteps ? 'شروع کنیم!' : 'بعدی'}
            </button>
            <button
              onClick={onSkip}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer bg-transparent border-none py-2"
            >
              رد کردن
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
