'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMiniPlayer } from './MiniPlayerProvider'

export default function MiniPlayer() {
  const { state, deactivate, updateTime } = useMiniPlayer()
  const pathname = usePathname()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  // Hide mini-player when on the same watch page
  const isOnWatchPage = state && pathname === `/watch/${state.episodeId}`

  useEffect(() => {
    if (!state || isOnWatchPage || !videoRef.current) return
    const video = videoRef.current

    // Use native HLS (Safari) or videojs for other browsers
    // For the mini-player, we use native <video> with the HLS src
    // Most browsers behind Video.js support HLS natively or via MSE
    // Safari supports HLS natively; for others, try the src directly
    video.src = state.hlsSrc
    const onLoaded = () => {
      if (state.currentTime > 0) video.currentTime = state.currentTime
      video.play().catch(() => {})
    }
    video.addEventListener('loadedmetadata', onLoaded)
    return () => video.removeEventListener('loadedmetadata', onLoaded)
  }, [state, isOnWatchPage])

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y }
  }

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setPosition({
        x: Math.max(0, dragStart.current.px - dx),
        y: Math.max(0, dragStart.current.py - dy),
      })
    }
    const onUp = () => setDragging(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  if (!state || isOnWatchPage) return null

  return (
    <div
      className="fixed z-50 shadow-2xl rounded-xl overflow-hidden bg-black border-2 border-[var(--color-border)] cursor-move group/mini"
      style={{
        width: 320,
        bottom: `${position.y + 80}px`,
        right: `${position.x}px`,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Video */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current) updateTime(videoRef.current.currentTime)
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Controls overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/mini:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover/mini:opacity-100">
          {/* Play / Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const v = videoRef.current
              if (!v) return
              isPlaying ? v.pause() : v.play()
            }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Expand — go to watch page */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/watch/${state.episodeId}`)
            }}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          </button>

          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              deactivate()
            }}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-3 py-1.5 bg-[var(--color-surface)]" dir="rtl">
        <p className="text-xs font-semibold text-[var(--color-text)] truncate">{state.title}</p>
        <p className="text-[10px] text-[var(--color-text-muted)] truncate">{state.channelName}</p>
      </div>
    </div>
  )
}
