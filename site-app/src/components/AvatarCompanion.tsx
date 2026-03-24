'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { AvatarConfig } from '@/lib/types'
import { useAvatarExpression } from '@/hooks/useAvatarExpression'
import AnimatedAvatar from './AnimatedAvatar'

interface AvatarCompanionProps {
  config: AvatarConfig
  childId: string
}

export default function AvatarCompanion({ config, childId }: AvatarCompanionProps) {
  const { expression } = useAvatarExpression()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load position from localStorage
  useEffect(() => {
    const key = `kidtube-companion-pos-${childId}`
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [childId])

  // Reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Fullscreen detection
  useEffect(() => {
    function handleFullscreen() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [])

  // Collapse timer
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setCollapsed(false)
    collapseTimer.current = setTimeout(() => setCollapsed(true), 5000)
  }, [])

  useEffect(() => {
    resetCollapseTimer()
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current)
    }
  }, [resetCollapseTimer])

  // Reset collapse on expression change
  useEffect(() => {
    if (expression !== 'idle') resetCollapseTimer()
  }, [expression, resetCollapseTimer])

  // Save position to localStorage (throttled)
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const key = `kidtube-companion-pos-${childId}`
      try { localStorage.setItem(key, JSON.stringify(pos)) } catch { /* ignore */ }
    }, 500)
  }, [childId])

  // Drag handlers
  function handlePointerDown(e: React.PointerEvent) {
    if (menuOpen) return
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position?.x ?? 16,
      posY: position?.y ?? 80,
    }
    setDragging(false)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y

    // Only start dragging after 5px threshold
    if (!dragging && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    setDragging(true)

    const newX = Math.max(16, Math.min(window.innerWidth - 80, dragStart.current.posX + dx))
    const newY = Math.max(16, Math.min(window.innerHeight - 80, dragStart.current.posY - dy))
    setPosition({ x: newX, y: newY })
    savePosition({ x: newX, y: newY })
    resetCollapseTimer()
  }

  function handlePointerUp() {
    if (!dragging && dragStart.current) {
      // It was a tap, not drag
      handleTap()
    }
    dragStart.current = null
    setDragging(false)
  }

  function handleTap() {
    resetCollapseTimer()
    if (collapsed) {
      setCollapsed(false)
    } else {
      setMenuOpen((prev) => !prev)
    }
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Hidden during fullscreen
  if (isFullscreen) return null

  const isRtl = document.documentElement.dir === 'rtl'
  const defaultPos = { x: 16, y: 80 }
  const pos = position || defaultPos
  const size = collapsed ? 32 : 64

  return (
    <div
      ref={containerRef}
      className="fixed z-40 select-none touch-none"
      style={{
        [isRtl ? 'right' : 'left']: pos.x,
        bottom: pos.y,
        width: size,
        height: size,
        transition: dragging ? 'none' : 'width 300ms cubic-bezier(0.34,1.56,0.64,1), height 300ms cubic-bezier(0.34,1.56,0.64,1)',
        animation: !reducedMotion && !dragging ? 'kidtube-float 3s ease-in-out infinite' : 'none',
        cursor: dragging ? 'grabbing' : 'pointer',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Companion bubble */}
      <div
        className="w-full h-full rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[var(--clay-shadow)] overflow-hidden flex items-center justify-center"
        style={{ opacity: 0.92 }}
      >
        <AnimatedAvatar
          config={config}
          expression={expression}
          size={collapsed ? 'sm' : 'md'}
        />
      </div>

      {/* Mini menu */}
      {menuOpen && !collapsed && (
        <div
          className="absolute bottom-full mb-2 bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-border)] shadow-[var(--clay-shadow)] py-1.5 min-w-[140px]"
          style={{
            [isRtl ? 'right' : 'left']: 0,
            animation: 'kidtube-bubble-pop 300ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <a
            href="/account"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <span>✏️</span>
            ویرایش آواتار
          </a>
          <a
            href="/profiles"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <span>👥</span>
            تغییر پروفایل
          </a>
        </div>
      )}
    </div>
  )
}
