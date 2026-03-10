'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-contrib-quality-menu/dist/videojs-contrib-quality-menu.css'
import type Player from 'video.js/dist/types/player'
import { CaptionSettings, loadPrefs } from './CaptionSettings'
import type { CaptionPrefs } from './CaptionSettings'
import SleepTimer from './SleepTimer'
import { useSoundContext } from './SoundProvider'

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

function toPersian(str: string): string {
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[+d])
}

// Add quality menu Persian translations (not included in Video.js fa.json)
videojs.addLanguage('fa', {
  'Quality Levels': 'کیفیت',
  'Auto': 'خودکار',
  'Standard Definition': 'کیفیت معمولی',
  'High Definition': 'کیفیت بالا',
  '{1}, selected': '{1}، انتخاب‌شده',
  'Playback Rate': 'سرعت پخش',
})

/** Convert all digit text nodes inside an element to Persian numerals */
function persianizeEl(el: Element | null) {
  if (!el) return
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    const converted = toPersian(node.data)
    if (converted !== node.data) node.data = converted
  }
}

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
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const [showSkipRecap, setShowSkipRecap] = useState(false)
  const [seekRipple, setSeekRipple] = useState<{ side: 'left' | 'right'; visible: boolean }>({ side: 'left', visible: false })
  const [showCaptionSettings, setShowCaptionSettings] = useState(false)
  const [longPressActive, setLongPressActive] = useState(false)
  const [swipeIndicator, setSwipeIndicator] = useState<{ type: 'volume' | 'brightness'; value: number } | null>(null)
  const lastTapRef = useRef<number>(0)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPlaybackRateRef = useRef<number>(1)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const brightnessRef = useRef<number>(1)
  const { play: playSound } = useSoundContext()

  // --- Double-tap seek ---
  const handleDoubleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now()
    const delta = now - lastTapRef.current
    lastTapRef.current = now

    if (delta > 0 && delta < 300) {
      const player = playerRef.current
      if (!player) return

      const rect = e.currentTarget.getBoundingClientRect()
      const tapX = e.changedTouches[0].clientX - rect.left
      const halfWidth = rect.width / 2

      const currentTime = player.currentTime() ?? 0
      if (tapX > halfWidth) {
        player.currentTime(currentTime + 10)
        setSeekRipple({ side: 'right', visible: true })
      } else {
        player.currentTime(Math.max(0, currentTime - 10))
        setSeekRipple({ side: 'left', visible: true })
      }

      if (isKidMode) playSound('pop')
      setTimeout(() => setSeekRipple((prev) => ({ ...prev, visible: false })), 600)
    }
  }, [isKidMode, playSound])

  // --- Long-press for 2x speed ---
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }

    longPressTimerRef.current = setTimeout(() => {
      const player = playerRef.current
      if (!player) return
      prevPlaybackRateRef.current = player.playbackRate() ?? 1
      player.playbackRate(2)
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
        // Volume control
        const currentVol = player.volume() ?? 0.5
        const delta = -dy / rect.height
        const newVol = Math.max(0, Math.min(1, currentVol + delta * 0.02))
        player.volume(newVol)
        setSwipeIndicator({ type: 'volume', value: newVol })
      } else {
        // Brightness control
        const delta = -dy / rect.height
        brightnessRef.current = Math.max(0.2, Math.min(1, brightnessRef.current + delta * 0.02))
        const videoEl = player.el()?.querySelector('video') as HTMLVideoElement | null
        if (videoEl) {
          videoEl.style.filter = `brightness(${brightnessRef.current})`
        }
        setSwipeIndicator({ type: 'brightness', value: brightnessRef.current })
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // Restore playback rate after long-press
    if (longPressActive) {
      const player = playerRef.current
      if (player) player.playbackRate(prevPlaybackRateRef.current)
      setLongPressActive(false)
    }

    touchStartRef.current = null

    // Hide swipe indicator after a short delay
    setTimeout(() => setSwipeIndicator(null), 800)
  }, [longPressActive])

  // --- Sleep timer callback ---
  const handleSleep = useCallback(() => {
    const player = playerRef.current
    if (player) player.pause()
  }, [])

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoEl = document.createElement('video-js')
      videoEl.classList.add('vjs-big-play-centered')

      // Kid mode: add a class for CSS-based control hiding
      if (isKidMode) {
        videoEl.classList.add('vjs-kid-mode')
      }

      videoRef.current.appendChild(videoEl)

      const controlBarConfig: Record<string, any> = {
        currentTimeDisplay: true,
        timeDivider: true,
        durationDisplay: true,
        remainingTimeDisplay: false,
        pictureInPictureToggle: !isKidMode,
      }

      if (!isKidMode) {
        controlBarConfig.playbackRateMenuButton = {
          playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        }
      }

      const player = videojs(videoEl, {
        language: 'fa',
        controls: true,
        responsive: true,
        fill: true,
        sources: [{ src: hlsSrc, type: 'application/x-mpegURL' }],
        controlBar: controlBarConfig,
      })
      playerRef.current = player

      // Persianize time displays on every time update
      const persianize = () => {
        const el = player.el()
        if (!el) return
        persianizeEl(el.querySelector('.vjs-current-time'))
        persianizeEl(el.querySelector('.vjs-duration'))
        persianizeEl(el.querySelector('.vjs-remaining-time'))
      }
      player.on('timeupdate', persianize)
      player.on('loadedmetadata', () => {
        persianize()
        if (initialTimeSec && initialTimeSec > 0) {
          player.currentTime(initialTimeSec)
        }
      })

      // Persianize time tooltips on progress bar hover via MutationObserver
      const progressEl = player.el()?.querySelector('.vjs-progress-control')
      let tooltipObserver: MutationObserver | undefined
      if (progressEl) {
        tooltipObserver = new MutationObserver(() => {
          progressEl.querySelectorAll('.vjs-time-tooltip').forEach((t) => persianizeEl(t))
        })
        tooltipObserver.observe(progressEl, { childList: true, subtree: true, characterData: true })
      }

      // Skip intro / skip recap button visibility
      player.on('timeupdate', () => {
        const ct = player.currentTime() ?? 0
        if (introEndSec && ct > 0 && ct < introEndSec) {
          setShowSkipIntro(true)
        } else {
          setShowSkipIntro(false)
        }
        if (recapEndSec && ct > 0 && ct < recapEndSec) {
          setShowSkipRecap(true)
        } else {
          setShowSkipRecap(false)
        }
      })

      // Throttled time update for progress reporting
      let lastReportTime = 0
      player.on('timeupdate', () => {
        if (!onTimeUpdate) return
        const now = Date.now()
        if (now - lastReportTime >= 15000) {
          lastReportTime = now
          onTimeUpdate(player.currentTime() ?? 0, player.duration() ?? 0)
        }
      })

      // Register quality menu plugin (skip in kid mode)
      if (!isKidMode) {
        import('videojs-contrib-quality-menu').then(() => {
          if (playerRef.current && !playerRef.current.isDisposed()) {
            (playerRef.current as any).qualityMenu({ useResolutionLabels: true })
          }
        })
      }

      if (subtitleSrc) {
        player.addRemoteTextTrack({
          src: subtitleSrc,
          kind: 'subtitles',
          srclang: 'fa',
          label: 'فارسی',
          default: true,
        }, false)
      }

      player.on('ended', () => onEnded?.())

      // Fire onPlay once on first play to record view
      let playFired = false
      player.on('play', () => {
        if (!playFired) {
          playFired = true
          onPlay?.()
        }
        if (isKidMode) playSound('whoosh')
      })

      // Apply caption preferences
      const applyCaptionPrefs = () => {
        const prefs: CaptionPrefs = loadPrefs()
        const el = player.el() as HTMLElement | null
        if (!el) return
        const display = el.querySelector('.vjs-text-track-display') as HTMLElement | null
        if (display) {
          display.style.fontSize = prefs.fontSize
        }
        const styleId = 'vjs-caption-custom-style'
        let styleEl = el.querySelector(`#${styleId}`) as HTMLStyleElement | null
        if (!styleEl) {
          styleEl = document.createElement('style')
          styleEl.id = styleId
          el.appendChild(styleEl)
        }
        styleEl.textContent = `
          .vjs-text-track-display .vjs-text-track-cue > div {
            background-color: rgba(0, 0, 0, ${prefs.bgOpacity}) !important;
            color: ${prefs.textColor} !important;
          }
        `
      }
      player.on('loadedmetadata', applyCaptionPrefs)
      const handlePrefsChange = () => applyCaptionPrefs()
      window.addEventListener('caption_prefs_changed', handlePrefsChange)

      // Cleanup observer on dispose
      player.on('dispose', () => {
        tooltipObserver?.disconnect()
        window.removeEventListener('caption_prefs_changed', handlePrefsChange)
      })
    }
  }, [hlsSrc, subtitleSrc, onEnded, onPlay, initialTimeSec, onTimeUpdate, introEndSec, recapEndSec, isKidMode, playSound])

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div
      dir="ltr"
      className={`absolute inset-0 group ${isKidMode ? 'kid-mode-player' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => {
        handleDoubleTap(e)
        handleTouchEnd()
      }}
    >
      <div ref={videoRef} className="w-full h-full" />

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
            {/* Icon */}
            <div className="text-white mb-1">
              {swipeIndicator.type === 'volume' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              )}
            </div>
            {/* Bar fill */}
            <div className="w-2 flex-1 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-white rounded-full transition-all duration-100"
                style={{ height: `${swipeIndicator.value * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Forward +10s button (right side) — hide in kid mode */}
      {!isKidMode && (
        <button
          onClick={() => {
            const player = playerRef.current
            if (player) player.currentTime((player.currentTime() ?? 0) + 10)
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="۱۰ ثانیه جلو"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      )}

      {/* Rewind -10s button (left side) — hide in kid mode */}
      {!isKidMode && (
        <button
          onClick={() => {
            const player = playerRef.current
            if (player) player.currentTime(Math.max(0, (player.currentTime() ?? 0) - 10))
          }}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="۱۰ ثانیه عقب"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
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

      {showSkipIntro && (
        <button
          onClick={() => {
            playerRef.current?.currentTime(introEndSec)
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
            playerRef.current?.currentTime(recapEndSec)
            if (isKidMode) playSound('pop')
          }}
          className={`absolute bottom-20 left-4 z-20 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] px-4 py-2 font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-primary-hover)] ${isKidMode ? 'text-lg min-h-[56px]' : 'text-sm'}`}
        >
          رد کردن خلاصه
        </button>
      )}

      {/* Overlay top-right control buttons — shown on hover, above the video */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Caption settings toggle */}
        <button
          onClick={() => setShowCaptionSettings((v) => !v)}
          className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
          aria-label="تنظیمات زیرنویس"
          title="تنظیمات زیرنویس"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h4M13 15h4M7 11h10" />
          </svg>
        </button>

        {/* Sleep timer */}
        {!isKidMode && <SleepTimer onSleep={handleSleep} />}

        {/* Theater mode toggle */}
        {onTheaterToggle && !isKidMode && (
          <button
            onClick={onTheaterToggle}
            className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
            aria-label={isTheater ? 'خروج از حالت تئاتر' : 'حالت تئاتر'}
            title={isTheater ? 'خروج از حالت تئاتر' : 'حالت تئاتر'}
          >
            {isTheater ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            )}
          </button>
        )}
      </div>

      {showCaptionSettings && (
        <div className="absolute top-14 right-3 z-30">
          <CaptionSettings onClose={() => setShowCaptionSettings(false)} />
        </div>
      )}
    </div>
  )
}
