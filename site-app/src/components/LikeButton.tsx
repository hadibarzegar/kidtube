'use client'

import { useState, useRef, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import { useAvatarExpression } from '@/hooks/useAvatarExpression'

interface LikeButtonProps {
  episodeId: string
  initialLiked: boolean
  initialLikeCount: number
}

interface Particle {
  id: number
  tx: number
  ty: number
  color: string
}

const PARTICLE_COLORS = ['#FF8A7A', '#FFD166', '#7EC8E3', '#C4A8E0', '#7ED6A8', '#FFB3D9']

export default function LikeButton({ episodeId, initialLiked, initialLikeCount }: LikeButtonProps) {
  const { triggerExpression } = useAvatarExpression()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const nextId = useRef(0)

  const spawnParticles = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 8 }, () => {
      const angle = Math.random() * Math.PI * 2
      const distance = 20 + Math.random() * 25
      return {
        id: nextId.current++,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      }
    })
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 600)
  }, [])

  async function handleClick() {
    if (loading) return
    setLoading(true)

    const wasLiked = liked
    const prevCount = likeCount
    setLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)

    if (!wasLiked) {
      setAnimating(true)
      spawnParticles()
      triggerExpression('happy')
      setTimeout(() => setAnimating(false), 500)
    }

    try {
      const method = wasLiked ? 'DELETE' : 'POST'
      const res = await authFetch(`/me/likes/${episodeId}`, { method })

      if (res.status === 401) {
        setLiked(wasLiked)
        setLikeCount(prevCount)
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (!res.ok && res.status !== 409) {
        setLiked(wasLiked)
        setLikeCount(prevCount)
      }
    } catch {
      setLiked(wasLiked)
      setLikeCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? 'برداشتن پسند' : 'پسندیدن'}
      className={[
        'relative flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-all duration-200',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:bg-[var(--color-border)]',
        liked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]',
      ].join(' ')}
    >
      {/* Burst particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none left-[14px] top-[10px]"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animation: 'kidtube-particle 600ms cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          } as React.CSSProperties}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill={p.color}>
            <circle cx="4" cy="4" r="4" />
          </svg>
        </span>
      ))}

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        style={animating ? { animation: 'kidtube-heart-pop 500ms cubic-bezier(0.34,1.56,0.64,1)' } : undefined}
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      {likeCount > 0 && <span>{likeCount.toLocaleString('fa-IR')}</span>}
    </button>
  )
}
