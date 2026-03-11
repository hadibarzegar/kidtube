'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  MediaPlayer,
  MediaProvider,
  Track,
  Tooltip,
  useMediaState,
  type MediaPlayerInstance,
} from '@vidstack/react'
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import { persianTranslations } from '@/lib/vidstack-fa'
import { CaptionSettings, loadPrefs } from './CaptionSettings'
import type { CaptionPrefs } from './CaptionSettings'
import { useSoundContext } from './SoundProvider'

interface VideoPlayerProps {
  hlsSrc: string
  subtitleSrc?: string
  onEnded?: () => void
  onPlay?: () => void
  initialTimeSec?: number
  onTimeUpdate?: (currentTime: number, duration: number) => void
  introEndSec?: number
  recapEndSec?: number
  isKidMode?: boolean
  onTheaterToggle?: () => void
  isTheater?: boolean
}

export function VideoPlayer({
  hlsSrc,
  subtitleSrc,
  onEnded,
  onPlay,
  initialTimeSec,
  onTimeUpdate,
  introEndSec,
  recapEndSec,
  isKidMode = false,
  onTheaterToggle,
  isTheater = false,
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null)
  const [showCaptionSettings, setShowCaptionSettings] = useState(false)
  const [longPressActive, setLongPressActive] = useState(false)
  const [seekRipple, setSeekRipple] = useState<{ side: 'left' | 'right'; visible: boolean }>({ side: 'left', visible: false })
  const [swipeIndicator, setSwipeIndicator] = useState<{
    type: 'volume' | 'brightness'
    value: number
  } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPlaybackRateRef = useRef<number>(1)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const brightnessRef = useRef<number>(1)
  const lastTapRef = useRef<number>(0)
  const playFiredRef = useRef(false)
  const lastReportTimeRef = useRef(0)
  const initialSeekDoneRef = useRef(false)
  const { play: playSound } = useSoundContext()

  // --- Sleep timer callback ---
  const handleSleep = useCallback(() => {
    playerRef.current?.pause()
  }, [])

  // --- Long-press for 2x speed ---
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }

    longPressTimerRef.current = setTimeout(() => {
      const player = playerRef.current
      if (!player) return
      prevPlaybackRateRef.current = player.playbackRate
      player.playbackRate = 2
      setLongPressActive(true)
    }, 500)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    if (!start) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - start.x)
    const dy = touch.clientY - start.y

    // Cancel long-press if finger moved
    if (dx > 15 || Math.abs(dy) > 15) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    // --- Vertical swipe: volume / brightness ---
    if (Math.abs(dy) > 20 && dx < 30) {
      const player = playerRef.current
      if (!player) return

      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
      const touchX = touch.clientX - rect.left
      const isRightHalf = touchX > rect.width / 2

      if (isRightHalf) {
        const currentVol = player.volume
        const delta = -dy / rect.height
        const newVol = Math.max(0, Math.min(1, currentVol + delta * 0.02))
        player.volume = newVol
        setSwipeIndicator({ type: 'volume', value: newVol })
      } else {
        const delta = -dy / rect.height
        brightnessRef.current = Math.max(0.2, Math.min(1, brightnessRef.current + delta * 0.02))
        const videoEl = player.el?.querySelector('video') as HTMLVideoElement | null
        if (videoEl) {
          videoEl.style.filter = `brightness(${brightnessRef.current})`
        }
        setSwipeIndicator({ type: 'brightness', value: brightnessRef.current })
      }
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Double-tap seek with ripple indicator
    const now = Date.now()
    const delta = now - lastTapRef.current
    lastTapRef.current = now
    if (delta > 0 && delta < 300) {
      const player = playerRef.current
      if (player) {
        const rect = e.currentTarget.getBoundingClientRect()
        const tapX = e.changedTouches[0].clientX - rect.left
        if (tapX > rect.width / 2) {
          player.currentTime += 10
          setSeekRipple({ side: 'right', visible: true })
        } else {
          player.currentTime = Math.max(0, player.currentTime - 10)
          setSeekRipple({ side: 'left', visible: true })
        }
        if (isKidMode) playSound('pop')
        setTimeout(() => setSeekRipple((prev) => ({ ...prev, visible: false })), 600)
      }
    }

    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // Restore playback rate after long-press
    if (longPressActive) {
      const player = playerRef.current
      if (player) player.playbackRate = prevPlaybackRateRef.current
      setLongPressActive(false)
    }

    touchStartRef.current = null
    setTimeout(() => setSwipeIndicator(null), 800)
  }, [longPressActive, isKidMode, playSound])

  // --- Caption prefs ---
  useEffect(() => {
    const applyCaptionPrefs = () => {
      const prefs: CaptionPrefs = loadPrefs()
      const el = playerRef.current?.el
      if (!el) return
      const display = el.querySelector('[data-media-captions]') as HTMLElement | null
      if (display) {
        display.style.fontSize = prefs.fontSize
      }
      const styleId = 'vidstack-caption-custom-style'
      let styleEl = el.querySelector(`#${styleId}`) as HTMLStyleElement | null
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = styleId
        el.appendChild(styleEl)
      }
      styleEl.textContent = `
        [data-media-captions] [data-part="cue"] {
          background-color: rgba(0, 0, 0, ${prefs.bgOpacity}) !important;
          color: ${prefs.textColor} !important;
        }
      `
    }

    // Apply on mount and on prefs change
    applyCaptionPrefs()
    window.addEventListener('caption_prefs_changed', applyCaptionPrefs)
    return () => window.removeEventListener('caption_prefs_changed', applyCaptionPrefs)
  }, [])

  return (
    <div
      dir="ltr"
      className={`absolute inset-0 group ${isKidMode ? 'kid-mode-player' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <MediaPlayer
        ref={playerRef}
        src={hlsSrc}
        crossOrigin
        playsInline
        onEnded={() => onEnded?.()}
        onPlay={() => {
          if (!playFiredRef.current) {
            playFiredRef.current = true
            onPlay?.()
          }
          if (isKidMode) playSound('whoosh')
        }}
        onTimeUpdate={() => {
          const player = playerRef.current
          if (!player || !onTimeUpdate) return
          const now = Date.now()
          if (now - lastReportTimeRef.current >= 15000) {
            lastReportTimeRef.current = now
            onTimeUpdate(player.currentTime, player.duration)
          }
        }}
        onCanPlay={() => {
          if (initialTimeSec && initialTimeSec > 0 && !initialSeekDoneRef.current) {
            initialSeekDoneRef.current = true
            const player = playerRef.current
            if (player) player.currentTime = initialTimeSec
          }
        }}
        className="w-full h-full"
      >
        <MediaProvider />

        {subtitleSrc && (
          <Track
            src={subtitleSrc}
            kind="subtitles"
            label="فارسی"
            lang="fa"
            default
          />
        )}

        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          translations={persianTranslations}
          slots={{
            // Hide PiP and settings in kid mode
            pipButton: isKidMode ? null : undefined,
            settingsMenu: isKidMode ? null : undefined,
            // Sleep timer + theater mode button before fullscreen
            beforeFullscreenButton: !isKidMode ? (
              <>
                <SleepTimerSlotButton onSleep={handleSleep} />
                {onTheaterToggle && (
                  <TheaterButton isTheater={isTheater} onToggle={onTheaterToggle} />
                )}
              </>
            ) : null,
            // Caption settings button after captions button
            afterCaptionButton: (
              <CaptionSettingsButton onClick={() => setShowCaptionSettings((v) => !v)} />
            ),
          }}
        />

        {/* Skip intro/recap overlays */}
        <SkipOverlays
          playerRef={playerRef}
          introEndSec={introEndSec}
          recapEndSec={recapEndSec}
          isKidMode={isKidMode}
          playSound={playSound}
        />
      </MediaPlayer>

      {/* Long-press 2x speed indicator */}
      {longPressActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-black/70 text-white text-sm font-bold flex items-center gap-1.5 animate-pulse pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 4.42-3.58 8-8 8s-8-3.58-8-8c0-4.08 3.05-7.44 7-7.93V2.05C5.94 2.55 2 6.81 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.19-3.94-9.45-9-9.95z"/><path d="M13.5 6l-4 4h3v4h2v-4h3z"/></svg>
          ۲×
        </div>
      )}

      {/* Vertical swipe volume/brightness indicator */}
      {swipeIndicator && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="w-12 h-32 bg-black/70 rounded-full flex flex-col items-center justify-end overflow-hidden p-1.5">
            <div className="text-white mb-1">
              {swipeIndicator.type === 'volume' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              )}
            </div>
            <div className="w-2 flex-1 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-white rounded-full transition-all duration-100"
                style={{ height: `${swipeIndicator.value * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Double-tap seek ripple */}
      {seekRipple.visible && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none text-white font-bold animate-pulse ${
            isKidMode ? 'text-4xl' : 'text-2xl'
          } ${seekRipple.side === 'right' ? 'right-16' : 'left-16'}`}
        >
          {seekRipple.side === 'right' ? '+۱۰' : '−۱۰'}
        </div>
      )}


      {/* Caption settings panel */}
      {showCaptionSettings && (
        <div className="absolute top-14 left-3 z-30">
          <CaptionSettings onClose={() => setShowCaptionSettings(false)} />
        </div>
      )}
    </div>
  )
}

// --- Internal sub-components ---

function TheaterButton({ isTheater, onToggle }: { isTheater: boolean; onToggle: () => void }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onToggle}
          className="vds-button"
          aria-label={isTheater ? 'خروج از حالت تئاتر' : 'حالت تئاتر'}
        >
          {isTheater ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          )}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="vds-tooltip-content" placement="top">
        {isTheater ? 'خروج از حالت تئاتر' : 'حالت تئاتر'}
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

function SleepTimerSlotButton({ onSleep }: { onSleep: () => void }) {
  const [open, setOpen] = useState(false)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number>(0)

  const PRESETS = [
    { label: '۱۵ دقیقه', minutes: 15 },
    { label: '۳۰ دقیقه', minutes: 30 },
    { label: '۴۵ دقیقه', minutes: 45 },
    { label: '۶۰ دقیقه', minutes: 60 },
  ] as const

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRemainingMs(null)
  }, [])

  const startTimer = useCallback((minutes: number) => {
    clearTimer()
    endTimeRef.current = Date.now() + minutes * 60 * 1000
    setRemainingMs(minutes * 60 * 1000)
    setOpen(false)

    timerRef.current = setInterval(() => {
      const left = endTimeRef.current - Date.now()
      if (left <= 0) {
        clearTimer()
        onSleep()
      } else {
        setRemainingMs(left)
      }
    }, 1000)
  }, [clearTimer, onSleep])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      .replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
  }

  return (
    <>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={() => setOpen(!open)}
            className="vds-button"
            aria-label="تایمر خواب"
          >
            {remainingMs ? (
              <span className="text-[10px] font-bold leading-none text-white">{formatTime(remainingMs)}</span>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content className="vds-tooltip-content" placement="top">
          تایمر خواب
        </Tooltip.Content>
      </Tooltip.Root>

      {open && (
        <div
          dir="rtl"
          className="absolute bottom-[var(--media-controls-group-height,48px)] right-0 z-50 w-44 p-3 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] text-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[var(--color-text)]">تایمر خواب</span>
            <button
              onClick={() => setOpen(false)}
              className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-xs hover:bg-black/20"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => startTimer(p.minutes)}
                className="w-full text-right py-1.5 px-2 rounded-lg hover:bg-[var(--color-primary-hover)] text-[var(--color-text)] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
          {remainingMs && (
            <button
              onClick={clearTimer}
              className="w-full mt-2 py-1.5 px-2 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] text-center font-medium cursor-pointer hover:bg-[var(--color-error)]/20 transition-colors"
            >
              لغو تایمر
            </button>
          )}
        </div>
      )}
    </>
  )
}

function CaptionSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className="vds-button"
          aria-label="تنظیمات زیرنویس"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h4M13 15h4M7 11h10" />
          </svg>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="vds-tooltip-content" placement="top">
        تنظیمات زیرنویس
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

function SkipOverlays({
  playerRef,
  introEndSec,
  recapEndSec,
  isKidMode,
  playSound,
}: {
  playerRef: React.RefObject<MediaPlayerInstance | null>
  introEndSec?: number
  recapEndSec?: number
  isKidMode: boolean
  playSound: (name: string) => void
}) {
  const currentTime = useMediaState('currentTime')

  const showSkipIntro = !!(introEndSec && currentTime > 0 && currentTime < introEndSec)
  const showSkipRecap = !!(recapEndSec && currentTime > 0 && currentTime < recapEndSec)

  return (
    <>
      {showSkipIntro && (
        <button
          onClick={() => {
            if (playerRef.current) playerRef.current.currentTime = introEndSec!
            if (isKidMode) playSound('pop')
          }}
          className={`absolute bottom-20 left-4 z-20 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] px-4 py-2 font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-primary-hover)] ${isKidMode ? 'text-lg min-h-[56px]' : 'text-sm'}`}
        >
          رد کردن مقدمه
        </button>
      )}
      {showSkipRecap && (
        <button
          onClick={() => {
            if (playerRef.current) playerRef.current.currentTime = recapEndSec!
            if (isKidMode) playSound('pop')
          }}
          className={`absolute bottom-20 left-4 z-20 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] px-4 py-2 font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-primary-hover)] ${isKidMode ? 'text-lg min-h-[56px]' : 'text-sm'}`}
        >
          رد کردن خلاصه
        </button>
      )}
    </>
  )
}
