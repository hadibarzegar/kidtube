'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/VideoPlayerWrapper'
import CountdownOverlay from '@/components/CountdownOverlay'
import BookmarkButton from '@/components/BookmarkButton'
import type { Episode, Channel } from '@/lib/types'

interface WatchClientProps {
  episode: Episode
  nextEpisode: Episode | null
  channel: Channel
  isBookmarked?: boolean
  episodeId?: string
}

export default function WatchClient({ episode, nextEpisode, channel, isBookmarked, episodeId }: WatchClientProps) {
  const router = useRouter()
  const [showCountdown, setShowCountdown] = useState(false)

  const onEnded = useCallback(() => {
    if (nextEpisode) {
      setShowCountdown(true)
    }
  }, [nextEpisode])

  const onProceed = useCallback(() => {
    if (nextEpisode) {
      router.push(`/watch/${nextEpisode.id}`)
    }
  }, [nextEpisode, router])

  const onCancel = useCallback(() => {
    setShowCountdown(false)
  }, [])

  return (
    <>
      {/* Player wrapper with countdown overlay */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <VideoPlayer
          hlsSrc={`/hls/${episode.id}/master.m3u8`}
          subtitleSrc={episode.subtitle_url || undefined}
          onEnded={onEnded}
        />
        {showCountdown && nextEpisode && (
          <CountdownOverlay
            nextEpisode={nextEpisode}
            onCancel={onCancel}
            onProceed={onProceed}
          />
        )}
      </div>

      {/* Episode info below player */}
      <div className="mt-4" dir="rtl">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl md:text-2xl font-bold">{episode.title}</h1>
          {episodeId !== undefined && (
            <BookmarkButton
              episodeId={episodeId}
              initialBookmarked={isBookmarked ?? false}
            />
          )}
        </div>
        {channel.name && (
          <a
            href={`/channel/${channel.id}`}
            className="text-blue-500 text-sm mt-1 block hover:underline"
          >
            {channel.name}
          </a>
        )}
        {episode.description && (
          <p className="text-gray-600 mt-2 text-sm">{episode.description}</p>
        )}
      </div>
    </>
  )
}
