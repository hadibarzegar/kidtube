import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import WatchClient from '@/app/watch/[id]/WatchClient'
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
        <p className="text-2xl font-bold text-[var(--color-text)] mb-4">ویدیو یافت نشد</p>
        <a href="/" className="text-[var(--color-primary)] hover:underline">
          بازگشت به صفحه اصلی
        </a>
      </div>
    )
  }

  const episode: Episode = await episodeRes.json()

  // Fetch channel, all episodes in this channel, and auth state in parallel
  const [channelRes, episodesRes, user] = await Promise.all([
    apiServerFetch(`/channels/${episode.channel_id}`),
    apiServerFetch(`/episodes?channel_id=${episode.channel_id}`),
    getCurrentUser(),
  ])

  const channel: Channel = channelRes.ok ? await channelRes.json() : { id: episode.channel_id, name: '' } as Channel
  const allEpisodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Compute next episode (order = current order + 1)
  const nextEpisode: Episode | null =
    allEpisodes.find((ep) => ep.order === episode.order + 1) ?? null

  // Filter out the current episode from the "other episodes" list
  const otherEpisodes = allEpisodes.filter((ep) => ep.id !== episode.id)

  // Check if the logged-in user has bookmarked this episode
  let isBookmarked = false
  if (user) {
    const token = await getSiteSession()
    if (token) {
      const bookRes = await apiServerAuthFetch('/me/bookmarks', token, { cache: 'no-store' })
      if (bookRes.ok) {
        const bookmarks: Episode[] = await bookRes.json()
        isBookmarked = bookmarks.some((ep) => ep.id === id)
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
      {/* Player + episode info — client component for interactivity */}
      <WatchClient
        episode={episode}
        nextEpisode={nextEpisode}
        channel={channel}
        isBookmarked={isBookmarked}
        episodeId={episode.id}
      />

      {/* Other episodes from this channel — static, rendered by Server Component */}
      {otherEpisodes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 text-[var(--color-text)]">قسمت‌های دیگر</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {otherEpisodes.map((ep, i) => (
              <ThumbnailCard
                key={ep.id}
                title={ep.title}
                href={`/watch/${ep.id}`}
                subtitle={`قسمت ${ep.order}`}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
