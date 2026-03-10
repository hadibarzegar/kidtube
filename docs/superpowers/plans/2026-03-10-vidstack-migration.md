# Vidstack Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Video.js with Vidstack Player while preserving all existing features including Persian i18n, gestures, kid mode, theater mode, and custom overlays.

**Architecture:** Use Vidstack's `DefaultVideoLayout` with `translations` prop for Persian, CSS variable overrides for styling, and custom overlay components for skip intro/recap, long-press speed, swipe gestures, and theater mode. Subtitles via `<Track>` component. Player state accessed via `useMediaState` and `useMediaPlayer` hooks.

**Tech Stack:** Vidstack (`@vidstack/react`), React 19, Next.js 16, Tailwind CSS 4, TypeScript 5

---

## Chunk 1: Dependencies and Core Player

### Task 1: Swap dependencies

**Files:**
- Modify: `site-app/package.json`
- Delete: `site-app/src/types/videojs-contrib-quality-menu.d.ts`

- [ ] **Step 1: Uninstall Video.js packages**

```bash
cd site-app && npm uninstall video.js videojs-contrib-quality-menu
```

- [ ] **Step 2: Install Vidstack**

```bash
cd site-app && npm install @vidstack/react
```

- [ ] **Step 3: Delete the Video.js type declaration file**

```bash
rm site-app/src/types/videojs-contrib-quality-menu.d.ts
```

- [ ] **Step 4: Verify install succeeded**

```bash
cd site-app && cat node_modules/@vidstack/react/package.json | head -5
```

Expected: shows `@vidstack/react` package info

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: swap video.js for @vidstack/react"
```

---

### Task 2: Create Persian translations file

**Files:**
- Create: `site-app/src/lib/vidstack-fa.ts`

This file centralises all Persian translations for Vidstack's DefaultVideoLayout. After install, check the full `DefaultLayoutTranslations` type from `@vidstack/react` for any missing keys and add them.

- [ ] **Step 1: Inspect available translation keys from Vidstack types**

```bash
cd site-app && grep -A 200 'DefaultLayoutTranslations' node_modules/@vidstack/react/dist/types/vidstack-react.d.ts | head -120
```

Use the output to build a complete translation object.

- [ ] **Step 2: Create the translations file**

Create `site-app/src/lib/vidstack-fa.ts`:

```typescript
import type { DefaultLayoutTranslations } from '@vidstack/react';

export const persianTranslations: Partial<DefaultLayoutTranslations> = {
  'Play': 'پخش',
  'Pause': 'توقف',
  'Replay': 'پخش مجدد',
  'Mute': 'بی‌صدا',
  'Unmute': 'صدادار',
  'Enter Fullscreen': 'تمام‌صفحه',
  'Exit Fullscreen': 'خروج از تمام‌صفحه',
  'Enter PiP': 'تصویر در تصویر',
  'Exit PiP': 'خروج از تصویر در تصویر',
  'Seek Forward': 'جلو',
  'Seek Backward': 'عقب',
  'Volume': 'صدا',
  'Speed': 'سرعت',
  'Normal': 'عادی',
  'Quality': 'کیفیت',
  'Auto': 'خودکار',
  'Captions': 'زیرنویس',
  'Closed-Captions On': 'زیرنویس روشن',
  'Closed-Captions Off': 'زیرنویس خاموش',
  'Settings': 'تنظیمات',
  'Accessibility': 'دسترسی‌پذیری',
  'Audio': 'صدا',
  'Loop': 'تکرار',
  'Default': 'پیش‌فرض',
  'Chapters': 'فصل‌ها',
  // Add any additional keys discovered from the type definition in Step 1
};

/**
 * Persian digit characters for converting Latin digits.
 * Used to persianize time displays rendered by custom components.
 */
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

export function toPersianDigits(str: string): string {
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
}
```

- [ ] **Step 3: Verify the file compiles**

```bash
cd site-app && npx tsc --noEmit src/lib/vidstack-fa.ts 2>&1 | head -20
```

Expected: no errors (or only unrelated errors from other files)

- [ ] **Step 4: Commit**

```bash
git add site-app/src/lib/vidstack-fa.ts && git commit -m "feat: add Persian translations for Vidstack player"
```

---

### Task 3: Rewrite VideoPlayer.tsx with Vidstack

**Files:**
- Rewrite: `site-app/src/components/VideoPlayer.tsx`

This is the main migration task. The new component uses `<MediaPlayer>`, `<MediaProvider>`, `<Track>`, and `<DefaultVideoLayout>`. Custom overlays (skip intro/recap, long-press indicator, swipe indicator, theater/caption buttons) are rendered inside `<MediaPlayer>` as siblings.

The component interface (`VideoPlayerProps`) stays identical so `WatchClient.tsx` needs minimal changes.

- [ ] **Step 1: Rewrite VideoPlayer.tsx**

Replace the entire file `site-app/src/components/VideoPlayer.tsx` with:

```tsx
'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  MediaPlayer,
  MediaProvider,
  Track,
  useMediaState,
  useMediaPlayer,
  type MediaPlayerInstance,
} from '@vidstack/react'
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import { persianTranslations, toPersianDigits } from '@/lib/vidstack-fa'
import { CaptionSettings, loadPrefs } from './CaptionSettings'
import type { CaptionPrefs } from './CaptionSettings'
import SleepTimer from './SleepTimer'
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
            // Theater mode button before fullscreen
            beforeFullscreenButton:
              onTheaterToggle && !isKidMode ? (
                <TheaterButton isTheater={isTheater} onToggle={onTheaterToggle} />
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

      {/* Sleep timer — rendered as overlay button, not inside Vidstack menu */}
      {!isKidMode && (
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <SleepTimer onSleep={handleSleep} />
        </div>
      )}

      {/* Caption settings panel */}
      {showCaptionSettings && (
        <div className="absolute top-14 right-3 z-30">
          <CaptionSettings onClose={() => setShowCaptionSettings(false)} />
        </div>
      )}
    </div>
  )
}

// --- Internal sub-components ---

function TheaterButton({ isTheater, onToggle }: { isTheater: boolean; onToggle: () => void }) {
  return (
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
  )
}

function CaptionSettingsButton({ onClick }: { onClick: () => void }) {
  return (
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
```

**Key differences from the old VideoPlayer.tsx:**
- No `videojs()` imperative init — all declarative via `<MediaPlayer>`
- No MutationObserver for Persian digits — Vidstack handles time display internally, translations cover labels
- No manual quality menu plugin — built into DefaultVideoLayout
- `useMediaState('currentTime')` replaces `player.on('timeupdate')` for skip overlays
- Player API uses properties (`player.currentTime = x`) not methods (`player.currentTime(x)`)
- `<Track>` replaces `player.addRemoteTextTrack()`
- Gestures (double-tap seek) available built-in, but we keep custom long-press and swipe handlers
- **Forward/Rewind hover buttons removed** — Vidstack's DefaultVideoLayout has built-in seek forward/backward buttons in the control bar, replacing the custom overlay buttons that appeared on hover in the old player
- **Sleep timer stays as overlay** — not placed inside Vidstack's settings menu slot because its popup menu with absolute positioning would break inside Vidstack's DOM structure

- [ ] **Step 2: Update VideoPlayerWrapper.tsx**

Replace `site-app/src/components/VideoPlayerWrapper.tsx` with:

```tsx
'use client'

import dynamic from 'next/dynamic'

const VideoPlayer = dynamic(
  () => import('./VideoPlayer').then(m => ({ default: m.VideoPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#2D2D3A] rounded-[inherit] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center animate-pulse shadow-[0_4px_20px_rgba(255,138,122,0.5)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-white/60 text-sm font-medium">در حال بارگذاری...</span>
      </div>
    ),
  }
)

export { VideoPlayer }
```

This stays nearly identical — Vidstack also needs client-side rendering for the player.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd site-app && npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors that arise. Common issues:
- Import paths for Vidstack types
- `MediaPlayerInstance` ref typing
- `useMediaState` requires being inside `<MediaPlayer>` context (which `SkipOverlays` is)

- [ ] **Step 4: Commit**

```bash
git add site-app/src/components/VideoPlayer.tsx site-app/src/components/VideoPlayerWrapper.tsx && git commit -m "feat: rewrite VideoPlayer with Vidstack"
```

---

## Chunk 2: CSS, Selectors, and Cleanup

### Task 4: Replace Video.js CSS with Vidstack overrides

**Files:**
- Modify: `site-app/src/app/globals.css` (lines 174-487)

- [ ] **Step 1: Remove all Video.js CSS**

Delete everything from the `/* ─── Video.js KidTube Skin ─── */` comment (line 174) through the end of the `/* ─── Kid Mode Controls ─── */` section (line 463). This includes all `.video-js` and `.vjs-*` rules.

Also delete the two `.video-js` lines inside the reduced-motion `@media` block near line 484-485:
```css
/* DELETE these two lines: */
.video-js:not(.vjs-has-started) .vjs-big-play-button { animation: none; }
.video-js .vjs-big-play-button:hover { transform: none; }
```

KEEP the `.theater-mode-player`, `.theater-mode-bg`, `.ambient-glow` rules and the `.ambient-glow { transition: none; }` inside the reduced-motion block. The replacement CSS in Step 2 includes fresh versions of these.

- [ ] **Step 2: Add Vidstack CSS variable overrides**

Insert the following after the claymorphism utility classes section (after line ~172, where the Video.js section used to be):

```css
/* ─── Vidstack Player Overrides ─── */

[data-media-player] {
  --media-brand: var(--color-primary);
  --media-focus-ring-color: var(--color-primary);
  --media-font-family: 'Vazirmatn', system-ui, sans-serif;
  --media-controls-color: #fff;
  font-family: 'Vazirmatn', system-ui, sans-serif;
}

/* Slider (progress bar) */
[data-media-player] [data-media-slider] {
  --media-slider-track-bg: rgba(255, 255, 255, 0.2);
  --media-slider-track-fill-bg: var(--color-primary);
  --media-slider-thumb-bg: #fff;
  --media-slider-thumb-border: 2.5px solid var(--color-primary);
}

/* Menus (quality, speed, captions) */
[data-media-player] [data-media-menu] {
  font-family: 'Vazirmatn', system-ui, sans-serif;
}

/* Captions — Vazirmatn font */
[data-media-player] [data-media-captions] {
  font-family: 'Vazirmatn', system-ui, sans-serif !important;
}

/* ─── Kid Mode ─── */
.kid-mode-player [data-media-player] {
  --media-controls-size: 48px;
}

.kid-mode-player [data-media-player] [data-media-play-button] {
  width: 56px;
  height: 56px;
}

/* ─── Theater Mode ─── */
.theater-mode-player {
  max-height: 85vh !important;
  border-radius: 0 !important;
}
.theater-mode-bg {
  background: #000;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  padding: 0;
}

/* ─── Ambient Mode Glow ─── */
.ambient-glow {
  transition: box-shadow 2s ease, background-color 2s ease;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ambient-glow { transition: none; }
}
```

- [ ] **Step 3: Verify no leftover `.video-js` or `.vjs-` references**

```bash
grep -n 'video-js\|\.vjs-' site-app/src/app/globals.css
```

Expected: no output (zero matches)

- [ ] **Step 4: Commit**

```bash
git add site-app/src/app/globals.css && git commit -m "style: replace Video.js CSS with Vidstack overrides"
```

---

### Task 5: Update ambient color selector

**Files:**
- Modify: `site-app/src/app/watch/[id]/WatchClient.tsx` (line 43)

Note: `useAmbientColor.ts` takes the selector as a parameter, so no change needed in the hook itself — only the caller in WatchClient.

- [ ] **Step 1: Update WatchClient.tsx selector**

In `site-app/src/app/watch/[id]/WatchClient.tsx`, change line 43 from:

```tsx
const ambientColor = useAmbientColor('.video-js video', ambientEnabled)
```

to:

```tsx
const ambientColor = useAmbientColor('[data-media-player] video', ambientEnabled)
```

- [ ] **Step 3: Commit**

```bash
git add site-app/src/app/watch/[id]/WatchClient.tsx && git commit -m "fix: update ambient color selector for Vidstack"
```

---

### Task 6: Build verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd site-app && npx tsc --noEmit 2>&1
```

Expected: no errors

- [ ] **Step 2: Run Next.js build**

```bash
cd site-app && npm run build 2>&1
```

Expected: build succeeds

- [ ] **Step 3: Fix any build errors**

Common issues to watch for:
- Missing CSS imports (ensure `@vidstack/react/player/styles/default/theme.css` and `layouts/video.css` are imported in VideoPlayer.tsx)
- React 19 compatibility — check if `@vidstack/react` needs a specific version for React 19 support
- `useMediaState` must be called inside `<MediaPlayer>` context — the `SkipOverlays` component is rendered as a child of `<MediaPlayer>` so this should work
- Vidstack's `onTimeUpdate` event signature may differ — adjust if needed

- [ ] **Step 4: Run the dev server and manually test**

```bash
cd site-app && npm run dev
```

Test checklist:
1. HLS video loads and plays
2. Quality menu appears in settings (gear icon)
3. Playback rate options work
4. Persian translations appear on controls
5. Subtitles display in Vazirmatn font
6. Caption settings panel opens and applies preferences
7. Skip intro/recap buttons appear at correct times
8. Double-tap seek works on mobile
9. Long-press 2x speed works
10. Vertical swipe volume/brightness works
11. Theater mode toggles correctly
12. Kid mode hides advanced controls
13. Sleep timer pauses the video
14. Ambient color glow updates from video
15. Progress reporting sends updates every 15s

- [ ] **Step 5: Final commit if any fixes were made**

```bash
git add -A && git commit -m "fix: resolve Vidstack migration build issues"
```
