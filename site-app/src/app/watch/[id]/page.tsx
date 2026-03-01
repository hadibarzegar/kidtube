import { apiServerFetch } from '@/lib/api'
import { VideoPlayer } from '@/components/VideoPlayerWrapper'
import ThumbnailCard from '@/components/ThumbnailCard'
import type { Episode, Channel } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const res = await apiServerFetch(`/episodes/${id}`)
  if (!res.ok) return { title: 'کیدتیوب' }
  const episode: Episode = await res.json()
  return { title: `${episode.title} — کیدتیوب` }
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params

  // Fetch episode
  const episodeRes = await apiServerFetch(`/episodes/${id}`)
  if (!episodeRes.ok) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-2xl font-bold text-gray-700 mb-4">ویدیو یافت نشد</p>
        <a href="/" className="text-blue-500 hover:underline">
          بازگشت به صفحه اصلی
        </a>
      </div>
    )
  }

  const episode: Episode = await episodeRes.json()

  // Fetch channel and other episodes in parallel
  const [channelRes, episodesRes] = await Promise.all([
    apiServerFetch(`/channels/${episode.channel_id}`),
    apiServerFetch(`/episodes?channel_id=${episode.channel_id}`),
  ])

  const channel: Channel = channelRes.ok ? await channelRes.json() : { id: episode.channel_id, name: '' } as Channel
  const allEpisodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Filter out the current episode from the "other episodes" list
  const otherEpisodes = allEpisodes.filter((ep) => ep.id !== episode.id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
      {/* Player section */}
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <VideoPlayer
          hlsSrc={`/hls/${episode.id}/master.m3u8`}
          subtitleSrc={episode.subtitle_url || undefined}
        />
      </div>

      {/* Episode info below player */}
      <div className="mt-4">
        <h1 className="text-xl md:text-2xl font-bold">{episode.title}</h1>
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

      {/* Other episodes from this channel */}
      {otherEpisodes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">قسمت‌های دیگر</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {otherEpisodes.map((ep) => (
              <ThumbnailCard
                key={ep.id}
                title={ep.title}
                href={`/watch/${ep.id}`}
                subtitle={`قسمت ${ep.order}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
