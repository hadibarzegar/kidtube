'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { authFetch } from '@/lib/api'
import type { ScreenTimeInfo, BedtimeRule } from '@/lib/types'
import TimeLockOverlay from './TimeLockOverlay'

interface ScreenTimeTimerProps {
  childId: string
  limitMinutes: number
}

export default function ScreenTimeTimer({ childId, limitMinutes }: ScreenTimeTimerProps) {
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null)
  const [timeExpired, setTimeExpired] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isBedtime, setIsBedtime] = useState(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bedtimeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchScreenTime = useCallback(async () => {
    try {
      const res = await authFetch(`/me/children/${childId}/screen-time`)
      if (res.ok) {
        const data: ScreenTimeInfo = await res.json()
        const remaining = data.limit_minutes - data.used_minutes
        if (remaining <= 0) {
          setTimeExpired(true)
          setRemainingMinutes(0)
        } else {
          setRemainingMinutes(remaining)
        }
      }
    } catch {
      // Silently fail, will retry on next heartbeat
    }
  }, [childId])

  const checkBedtime = useCallback(async () => {
    try {
      const res = await authFetch(`/me/children/${childId}/bedtime`)
      if (res.ok) {
        const bedtime: BedtimeRule = await res.json()
        if (bedtime.enabled && bedtime.is_bedtime) {
          setIsBedtime(true)
        } else {
          setIsBedtime(false)
        }
      }
    } catch {
      // Silently fail
    }
  }, [childId])

  // Send heartbeat every 60 seconds
  const sendHeartbeat = useCallback(async () => {
    try {
      await authFetch(`/me/children/${childId}/screen-time`, {
        method: 'POST',
        body: JSON.stringify({ minutes: 1 }),
      })
    } catch {
      // Silently fail
    }
  }, [childId])

  useEffect(() => {
    if (limitMinutes <= 0) return // No limit set

    fetchScreenTime()

    // Send heartbeat every 60 seconds
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat()
      fetchScreenTime()
    }, 60_000)

    // Local countdown every 60 seconds
    countdownRef.current = setInterval(() => {
      setRemainingMinutes((prev) => {
        if (prev === null) return prev
        const next = prev - 1
        if (next <= 0) {
          setTimeExpired(true)
          return 0
        }
        return next
      })
    }, 60_000)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [childId, limitMinutes, fetchScreenTime, sendHeartbeat])

  // Check bedtime regardless of screen time limit
  useEffect(() => {
    checkBedtime()
    bedtimeRef.current = setInterval(checkBedtime, 60_000)
    return () => {
      if (bedtimeRef.current) clearInterval(bedtimeRef.current)
    }
  }, [checkBedtime])

  // Show lock overlay during bedtime
  if (isBedtime) {
    return <TimeLockOverlay childId={childId} />
  }

  // Don't render anything if no limit is set
  if (limitMinutes <= 0) return null

  if (timeExpired) {
    return <TimeLockOverlay childId={childId} />
  }

  if (remainingMinutes === null) return null

  const hours = Math.floor(remainingMinutes / 60)
  const mins = remainingMinutes % 60

  return (
    <>
      {visible && (
        <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2">
          <div className="bg-[var(--color-surface)] rounded-full border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] px-4 py-2 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-text)]">
              {hours > 0 ? `${hours} ساعت و ` : ''}
              {mins} دقیقه
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="w-6 h-6 rounded-full bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center text-xs cursor-pointer hover:bg-[var(--color-bg)] transition-colors"
            aria-label="مخفی کردن تایمر"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
