'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/VideoPlayerWrapper'
import CountdownOverlay from '@/components/CountdownOverlay'
import BookmarkButton from '@/components/BookmarkButton'
import LikeButton from '@/components/LikeButton'
import SubscribeButton from '@/components/SubscribeButton'
import ShareButton from '@/components/ShareButton'
import ReportButton from '@/components/ReportButton'
import BlockEpisodeButton from '@/components/BlockEpisodeButton'
import AddToPlaylistModal from '@/components/AddToPlaylistModal'
import { useAmbientColor } from '@/hooks/useAmbientColor'
import { apiFetch, authFetch } from '@/lib/api'
import type { Episode, Channel } from '@/lib/types'
import { resolveImageUrl } from '@/lib/image'

interface WatchClientProps {
  episode: Episode
  nextEpisode: Episode | null
  channel: Channel
  isBookmarked?: boolean
  isSubscribed?: boolean
  isLiked?: boolean
  episodeId?: string
  initialProgressSec?: number
  isLoggedIn?: boolean
  activeChildId?: string | null
}

export default function WatchClient({ episode, nextEpisode, channel, isBookmarked, isSubscribed, isLiked, episodeId, initialProgressSec, isLoggedIn, activeChildId }: WatchClientProps) {
  const router = useRouter()
  const [showCountdown, setShowCountdown] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [isTheater, setIsTheater] = useState(false)
  const [ambientEnabled, setAmbientEnabled] = useState(true)
  const viewRecorded = useRef(false)
  const currentTimeRef = useRef(0)

  // Ambient mode: extract dominant color from video
  const ambientColor = useAmbientColor('[data-media-player] video', ambientEnabled)

  const isKidMode = !!activeChildId

  const onEnded = useCallback(() => {
    if (nextEpisode) setShowCountdown(true)
  }, [nextEpisode])

  const onProceed = useCallback(() => {
    if (nextEpisode) router.push(`/watch/${nextEpisode.id}`)
  }, [nextEpisode, router])

  const onCancel = useCallback(() => {
    setShowCountdown(false)
  }, [])

  const onPlay = useCallback(() => {
    if (viewRecorded.current) return
    viewRecorded.current = true
    apiFetch(`/episodes/${episode.id}/views`, { method: 'POST' }).catch(() => {})
  }, [episode.id])

  const onTimeUpdate = useCallback((currentTime: number, duration: number) => {
    currentTimeRef.current = currentTime
    if (!isLoggedIn || !episodeId) return
    authFetch(`/me/watch-progress/${episodeId}`, {
      method: 'POST',
      body: JSON.stringify({
        progress_sec: Math.floor(currentTime),
        duration_sec: Math.floor(duration),
      }),
    }).catch(() => {})
  }, [episodeId, isLoggedIn])

  const handleTheaterToggle = useCallback(() => {
    setIsTheater(prev => !prev)
  }, [])

  const channelInitial = channel.name?.charAt(0) || '?'
  const hasDescription = !!episode.description?.trim()

  return (
    <div dir="rtl">
      {/* Ambient glow wrapper */}
      <div
        className={`rounded-2xl p-1 ambient-glow ${isTheater ? 'theater-mode-bg' : ''}`}
        style={
          ambientColor
            ? {
                boxShadow: `0 0 80px 30px ${ambientColor}, 0 0 160px 60px ${ambientColor}`,
              }
            : undefined
        }
      >
        {/* Player */}
        <div
          className={`relative bg-black w-full aspect-video mx-auto ${
            isTheater ? 'theater-mode-player max-h-[85vh] rounded-none' : 'overflow-hidden rounded-2xl max-h-[70vh]'
          }`}
        >
          <VideoPlayer
            hlsSrc={`/hls/${episode.id}/master.m3u8`}
            subtitleSrc={episode.subtitle_url || undefined}
            onEnded={onEnded}
            onPlay={onPlay}
            initialTimeSec={initialProgressSec}
            onTimeUpdate={onTimeUpdate}
            introEndSec={episode.intro_end_sec}
            recapEndSec={episode.recap_end_sec}
            isKidMode={isKidMode}
            onTheaterToggle={handleTheaterToggle}
            isTheater={isTheater}
          />
          {showCountdown && nextEpisode && (
            <CountdownOverlay key="countdown"
              nextEpisode={nextEpisode}
              onCancel={onCancel}
              onProceed={onProceed}
            />
          )}
        </div>
      </div>

      {/* Controls row below player: ambient toggle + mini-player button */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-3">
          {/* Title */}
          <h1 className="text-lg md:text-xl font-bold text-[var(--color-text)] leading-snug font-display">
            {episode.title || channel.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Ambient mode toggle */}
          {!isKidMode && (
            <button
              onClick={() => setAmbientEnabled(!ambientEnabled)}
              className={`text-xs px-3 py-1 rounded-full border-2 transition-colors cursor-pointer ${
                ambientEnabled
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-hover)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
              title={ambientEnabled ? 'غیرفعال کردن حالت محیطی' : 'فعال کردن حالت محیطی'}
            >
              {ambientEnabled ? '🌈 محیطی' : '🌈 محیطی'}
            </button>
          )}

        </div>
      </div>

      {/* View count + episode number */}
      <div className="flex items-center gap-2 mt-0.5 text-sm text-[var(--color-text-muted)] px-1">
        {episode.view_count > 0 && (
          <span>{episode.view_count.toLocaleString('fa-IR')} بازدید</span>
        )}
        {episode.view_count > 0 && episode.order > 0 && <span>·</span>}
        {episode.order > 0 && (
          <span>قسمت {episode.order}</span>
        )}
      </div>

      {/* Channel row + action buttons */}
      <div className="mt-3 space-y-3">
        {/* Channel info + subscribe */}
        <div className="flex items-center justify-between gap-3">
          <a
            href={`/channel/${channel.id}`}
            className="flex items-center gap-2.5 no-underline min-w-0 group"
          >
            {resolveImageUrl(channel.thumbnail) ? (
              <img
                src={resolveImageUrl(channel.thumbnail)}
                alt={channel.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--color-secondary-light)] flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--color-secondary)] font-bold text-base">{channelInitial}</span>
              </div>
            )}
            <span className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-text-muted)] transition-colors truncate text-sm">
              {channel.name}
            </span>
          </a>
          <SubscribeButton
            channelId={channel.id}
            initialSubscribed={isSubscribed ?? false}
          />
        </div>

        {/* Action buttons — horizontal scroll on mobile */}
        {episodeId !== undefined && (
          <div className="overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch]">
            <div className="flex items-center gap-2 w-max">
              <div className="flex items-center bg-[var(--color-surface)] rounded-full border-[2px] border-[var(--color-border)]">
                <LikeButton
                  episodeId={episodeId}
                  initialLiked={isLiked ?? false}
                  initialLikeCount={episode.like_count ?? 0}
                />
                <div className="w-px h-5 bg-[var(--color-border)]" />
                <BookmarkButton
                  episodeId={episodeId}
                  initialBookmarked={isBookmarked ?? false}
                />
                <div className="w-px h-5 bg-[var(--color-border)]" />
                <ShareButton episodeId={episodeId} title={episode.title} />
              </div>
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
                title="افزودن به لیست پخش"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <ReportButton episodeId={episodeId} />
              <BlockEpisodeButton episodeId={episodeId} childId={activeChildId ?? null} />
            </div>
          </div>
        )}
      </div>

      {/* Description card */}
      {hasDescription && (
        <div
          className={[
            'mt-3 rounded-xl p-3 cursor-pointer transition-colors',
            'bg-[var(--color-surface)] hover:bg-[var(--color-border)]',
          ].join(' ')}
          onClick={() => setDescExpanded(!descExpanded)}
        >
          <p
            className={`text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line ${
              !descExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {episode.description}
          </p>
          {episode.description.length > 80 && (
            <button
              className="mt-1 text-xs font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
            >
              {descExpanded ? 'کمتر' : 'نمایش بیشتر...'}
            </button>
          )}
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showPlaylistModal && episodeId && (
        <AddToPlaylistModal
          episodeId={episodeId}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  )
}
