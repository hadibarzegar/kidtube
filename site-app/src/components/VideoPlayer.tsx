'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-contrib-quality-menu/dist/videojs-contrib-quality-menu.css'
import type Player from 'video.js/dist/types/player'
import { CaptionSettings, loadPrefs } from './CaptionSettings'
import type { CaptionPrefs } from './CaptionSettings'

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
}

export function VideoPlayer({ hlsSrc, subtitleSrc, onEnded, onPlay, initialTimeSec, onTimeUpdate, introEndSec, recapEndSec }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const [showSkipRecap, setShowSkipRecap] = useState(false)
  const [seekRipple, setSeekRipple] = useState<{ side: 'left' | 'right'; visible: boolean }>({ side: 'left', visible: false })
  const [showCaptionSettings, setShowCaptionSettings] = useState(false)
  const lastTapRef = useRef<number>(0)

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
        // Right half = forward (RTL: forward direction)
        player.currentTime(currentTime + 10)
        setSeekRipple({ side: 'right', visible: true })
      } else {
        // Left half = rewind (RTL: backward direction)
        player.currentTime(Math.max(0, currentTime - 10))
        setSeekRipple({ side: 'left', visible: true })
      }

      setTimeout(() => setSeekRipple((prev) => ({ ...prev, visible: false })), 600)
    }
  }, [])

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoEl = document.createElement('video-js')
      videoEl.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoEl)

      const player = videojs(videoEl, {
        language: 'fa',
        controls: true,
        responsive: true,
        fill: true,
        sources: [{ src: hlsSrc, type: 'application/x-mpegURL' }],
        controlBar: {
          currentTimeDisplay: true,
          timeDivider: true,
          durationDisplay: true,
          remainingTimeDisplay: false,
          playbackRateMenuButton: {
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
          },
          pictureInPictureToggle: true,
        },
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

      // Register quality menu plugin
      import('videojs-contrib-quality-menu').then(() => {
        if (playerRef.current && !playerRef.current.isDisposed()) {
          (playerRef.current as any).qualityMenu({ useResolutionLabels: true })
        }
      })

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
        // Apply background opacity and text color via a style element
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
      // Also apply when prefs change via the settings panel
      const handlePrefsChange = () => applyCaptionPrefs()
      window.addEventListener('caption_prefs_changed', handlePrefsChange)

      // Cleanup observer on dispose
      player.on('dispose', () => {
        tooltipObserver?.disconnect()
        window.removeEventListener('caption_prefs_changed', handlePrefsChange)
      })
    }
  }, [hlsSrc, subtitleSrc, onEnded, onPlay, initialTimeSec, onTimeUpdate, introEndSec, recapEndSec])

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div dir="ltr" className="absolute inset-0 group" onTouchEnd={handleDoubleTap}>
      <div ref={videoRef} className="w-full h-full" />

      {/* Forward +10s button (right side) */}
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

      {/* Rewind -10s button (left side) */}
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

      {/* Double-tap seek ripple */}
      {seekRipple.visible && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none text-white text-2xl font-bold animate-pulse ${
            seekRipple.side === 'right' ? 'right-16' : 'left-16'
          }`}
        >
          {seekRipple.side === 'right' ? '+۱۰' : '−۱۰'}
        </div>
      )}

      {showSkipIntro && (
        <button
          onClick={() => playerRef.current?.currentTime(introEndSec)}
          className="absolute bottom-20 left-4 z-20 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] px-4 py-2 text-sm font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-primary-hover)]"
        >
          رد کردن مقدمه
        </button>
      )}
      {showSkipRecap && (
        <button
          onClick={() => playerRef.current?.currentTime(recapEndSec)}
          className="absolute bottom-20 left-4 z-20 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] px-4 py-2 text-sm font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-primary-hover)]"
        >
          رد کردن خلاصه
        </button>
      )}

      {/* Caption settings toggle */}
      <button
        onClick={() => setShowCaptionSettings((v) => !v)}
        className="absolute bottom-2 left-[140px] z-20 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
        aria-label="تنظیمات زیرنویس"
        title="تنظیمات زیرنویس"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M7 15h4M13 15h4M7 11h10" />
        </svg>
      </button>

      {showCaptionSettings && (
        <CaptionSettings onClose={() => setShowCaptionSettings(false)} />
      )}
    </div>
  )
}
