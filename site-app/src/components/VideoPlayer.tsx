'use client'

import React, { useRef, useEffect } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-contrib-quality-menu/dist/videojs-contrib-quality-menu.css'
import type Player from 'video.js/dist/types/player'

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
}

export function VideoPlayer({ hlsSrc, subtitleSrc, onEnded, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

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
          playbackRateMenuButton: false,
          pictureInPictureToggle: false,
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
      player.on('loadedmetadata', persianize)

      // Persianize time tooltips on progress bar hover via MutationObserver
      const progressEl = player.el()?.querySelector('.vjs-progress-control')
      let tooltipObserver: MutationObserver | undefined
      if (progressEl) {
        tooltipObserver = new MutationObserver(() => {
          progressEl.querySelectorAll('.vjs-time-tooltip').forEach((t) => persianizeEl(t))
        })
        tooltipObserver.observe(progressEl, { childList: true, subtree: true, characterData: true })
      }

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

      // Cleanup observer on dispose
      player.on('dispose', () => tooltipObserver?.disconnect())
    }
  }, [hlsSrc, subtitleSrc, onEnded, onPlay])

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div dir="ltr" className="absolute inset-0">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  )
}
