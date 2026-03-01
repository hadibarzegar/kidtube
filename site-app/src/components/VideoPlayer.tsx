'use client'

import React, { useRef, useEffect } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  hlsSrc: string          // /hls/{episode_id}/master.m3u8
  subtitleSrc?: string    // subtitle_url from episode doc
  onEnded?: () => void    // triggers countdown overlay (wired in Plan 04)
}

export function VideoPlayer({ hlsSrc, subtitleSrc, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoEl = document.createElement('video-js')
      videoEl.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoEl)

      playerRef.current = videojs(videoEl, {
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.75, 1, 1.25, 1.5],
        sources: [{ src: hlsSrc, type: 'application/x-mpegURL' }],
        controlBar: {
          playbackRateMenuButton: true,
        },
      })

      // Add subtitle track if available
      if (subtitleSrc) {
        playerRef.current.addRemoteTextTrack({
          src: subtitleSrc,
          kind: 'subtitles',
          srclang: 'fa',
          label: 'فارسی',
          default: true,
        }, false)
      }

      playerRef.current.on('ended', () => {
        onEnded?.()
      })
    }
  }, [hlsSrc, subtitleSrc, onEnded])

  // Cleanup on unmount — MUST call dispose() to free media streams
  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    // dir="ltr" prevents RTL page layout from reversing player controls (PLAY-07)
    <div dir="ltr">
      <div ref={videoRef} />
    </div>
  )
}
