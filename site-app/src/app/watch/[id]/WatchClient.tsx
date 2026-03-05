'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/VideoPlayerWrapper'
import CountdownOverlay from '@/components/CountdownOverlay'
import BookmarkButton from '@/components/BookmarkButton'
import LikeButton from '@/components/LikeButton'
import SubscribeButton from '@/components/SubscribeButton'
import { apiFetch } from '@/lib/api'
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
}

export default function WatchClient({ episode, nextEpisode, channel, isBookmarked, isSubscribed, isLiked, episodeId }: WatchClientProps) {
  const router = useRouter()
  const [showCountdown, setShowCountdown] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const viewRecorded = useRef(false)

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
    // Fire-and-forget — record the view
    apiFetch(`/episodes/${episode.id}/views`, { method: 'POST' }).catch(() => {})
  }, [episode.id])

  const channelInitial = channel.name?.charAt(0) || '?'
  const hasDescription = !!episode.description?.trim()

  return (
    <div dir="rtl">
      {/* Player */}
      <div className="relative rounded-2xl overflow-hidden bg-black w-full aspect-video max-h-[70vh] mx-auto">
        <VideoPlayer
          hlsSrc={`/hls/${episode.id}/master.m3u8`}
          subtitleSrc={episode.subtitle_url || undefined}
          onEnded={onEnded}
          onPlay={onPlay}
        />
        {showCountdown && nextEpisode && (
          <CountdownOverlay key="countdown"
            nextEpisode={nextEpisode}
            onCancel={onCancel}
            onProceed={onProceed}
          />
        )}
      </div>

      {/* Title */}
      <div className="mt-3">
        <h1 className="text-lg md:text-xl font-bold text-[var(--color-text)] leading-snug font-display">
          {episode.title || channel.name}
        </h1>
        <div className="flex items-center gap-2 mt-0.5 text-sm text-[var(--color-text-muted)]">
          {episode.view_count > 0 && (
            <span>{episode.view_count.toLocaleString('fa-IR')} بازدید</span>
          )}
          {episode.view_count > 0 && episode.order > 0 && <span>·</span>}
          {episode.order > 0 && (
            <span>قسمت {episode.order}</span>
          )}
        </div>
      </div>

      {/* Channel row + action buttons */}
      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
        {/* Channel info + subscribe */}
        <div className="flex items-center gap-3 min-w-0">
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

        {/* Action buttons (like + bookmark grouped) */}
        {episodeId !== undefined && (
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
    </div>
  )
}
