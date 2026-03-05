import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import WatchClient from '@/app/watch/[id]/WatchClient'
import MiniCard from '@/components/MiniCard'
import type { Episode, Channel } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const res = await apiServerFetch(`/episodes/${id}`)
  if (!res.ok) return { title: 'KidTube' }
  const episode: Episode = await res.json()
  return { title: `${episode.title} — KidTube` }
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

  // Check bookmark + subscription + like state for logged-in user
  let isBookmarked = false
  let isSubscribed = false
  let isLiked = false
  if (user) {
    const token = await getSiteSession()
    if (token) {
      const [bookRes, subRes, likesRes] = await Promise.all([
        apiServerAuthFetch('/me/bookmarks', token, { cache: 'no-store' }),
        apiServerAuthFetch('/me/subscriptions', token, { cache: 'no-store' }),
        apiServerAuthFetch('/me/likes', token, { cache: 'no-store' }),
      ])
      if (bookRes.ok) {
        const bookmarks: Episode[] = await bookRes.json()
        isBookmarked = bookmarks.some((ep) => ep.id === id)
      }
      if (subRes.ok) {
        const subscriptions: Channel[] = await subRes.json()
        isSubscribed = subscriptions.some((ch) => ch.id === channel.id)
      }
      if (likesRes.ok) {
        const likes: Episode[] = await likesRes.json()
        isLiked = likes.some((ep) => ep.id === id)
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 md:py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column: video + info */}
        <div className="flex-1 min-w-0">
          <WatchClient
            episode={episode}
            nextEpisode={nextEpisode}
            channel={channel}
            isBookmarked={isBookmarked}
            isSubscribed={isSubscribed}
            isLiked={isLiked}
            episodeId={episode.id}
          />
        </div>

        {/* Sidebar: other episodes (desktop: right column, mobile: below) */}
        {otherEpisodes.length > 0 && (
          <div className="lg:w-[400px] flex-shrink-0" dir="rtl">
            <h2 className="text-base font-bold mb-3 text-[var(--color-text)] font-display">
              قسمت‌های دیگر از {channel.name}
            </h2>
            <div className="flex flex-col gap-3">
              {otherEpisodes.map((ep) => (
                <MiniCard
                  key={ep.id}
                  title={ep.title}
                  thumbnail={ep.thumbnail}
                  href={`/watch/${ep.id}`}
                  channelName={channel.name}
                  episodeNumber={ep.order}
                  viewCount={ep.view_count}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
