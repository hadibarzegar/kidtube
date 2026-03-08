import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch, apiServerFetch } from '@/lib/api'
import type { Playlist, Episode, Channel } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'

export const metadata = {
  title: 'لیست پخش — KidTube',
}

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await getSiteSession()
  let playlist: Playlist | null = null
  let episodes: Episode[] = []
  const channelMap = new Map<string, Channel>()

  if (token) {
    const res = await apiServerAuthFetch(`/me/playlists/${id}`, token, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      playlist = data
      // If the response includes episodes inline, use them; otherwise fetch individually
      if (data.episodes) {
        episodes = data.episodes
      } else if (data.episode_ids?.length) {
        const epResults = await Promise.all(
          data.episode_ids.map(async (epId: string) => {
            try {
              const epRes = await apiServerFetch(`/episodes/${epId}`, { cache: 'no-store' })
              if (epRes.ok) return (await epRes.json()) as Episode
            } catch {}
            return null
          })
        )
        episodes = epResults.filter((e): e is Episode => e !== null)
      }
    }

    // Fetch channel data for each unique channel_id
    const channelIds = [...new Set(episodes.map((ep) => ep.channel_id).filter(Boolean))]
    const channelResults = await Promise.all(
      channelIds.map(async (cid) => {
        try {
          const chRes = await apiServerFetch(`/channels/${cid}`, { cache: 'no-store' })
          if (chRes.ok) return (await chRes.json()) as Channel
        } catch {}
        return null
      })
    )
    channelResults.forEach((ch) => {
      if (ch) channelMap.set(ch.id, ch)
    })
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">لیست پخش یافت نشد</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <a
            href="/playlists"
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            بازگشت به لیست‌ها
          </a>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{playlist.description}</p>
          )}
          <p className="text-xs text-[var(--color-text-faint)] mt-1">
            {episodes.length.toLocaleString('fa-IR')} ویدیو
          </p>
        </div>

        {episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-faint)]">
            <p className="text-lg font-medium text-[var(--color-text-muted)]">
              این لیست خالی است
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {episodes.map((ep, i) => {
              const channel = channelMap.get(ep.channel_id)
              return (
                <ThumbnailCard
                  key={ep.id}
                  title={ep.title}
                  thumbnail={ep.thumbnail}
                  href={`/watch/${ep.id}`}
                  index={i}
                  channelName={channel?.name}
                  channelThumbnail={channel?.thumbnail}
                  channelHref={channel ? `/channel/${channel.id}` : undefined}
                  episodeNumber={ep.order}
                  viewCount={ep.view_count}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
