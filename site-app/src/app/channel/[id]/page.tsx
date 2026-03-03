import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { resolveImageUrl } from '@/lib/image'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import type { Channel, Episode } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'
import SubscribeButton from '@/components/SubscribeButton'

interface ChannelPageProps {
  params: Promise<{ id: string }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params

  const [channelRes, episodesRes] = await Promise.all([
    apiServerFetch(`/channels/${encodeURIComponent(id)}`),
    apiServerFetch(`/episodes?channel_id=${encodeURIComponent(id)}`),
  ])

  if (!channelRes.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center py-16">
          <p className="text-2xl font-bold text-[var(--color-text-faint)] mb-2">کانال یافت نشد</p>
          <a href="/" className="text-[var(--color-primary)] hover:underline">بازگشت به خانه</a>
        </div>
      </div>
    )
  }

  const channel: Channel = await channelRes.json()
  const episodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Check if the logged-in user is subscribed to this channel
  const user = await getCurrentUser()
  let isSubscribed = false
  if (user) {
    const token = await getSiteSession()
    if (token) {
      const subsRes = await apiServerAuthFetch('/me/subscriptions', token, { cache: 'no-store' })
      if (subsRes.ok) {
        const subs: Channel[] = await subsRes.json()
        isSubscribed = subs.some((ch) => ch.id === id)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Back button */}
      <div className="px-4 pt-4">
        <a
          href="/browse"
          className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium no-underline transition-colors min-h-[44px]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>بازگشت</span>
        </a>
      </div>

      {/* Channel hero / banner */}
      <div className="relative w-full bg-gradient-to-br from-[#FDBCB4] via-[#E6E6FA] to-[#ADD8E6] aspect-[3/1] overflow-hidden">
        {resolveImageUrl(channel.thumbnail) ? (
          <img
            src={resolveImageUrl(channel.thumbnail)}
            alt={channel.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-6xl font-bold opacity-60">
              {channel.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 right-0 p-4">
          <h1 className="text-white text-2xl font-bold drop-shadow">{channel.name}</h1>
        </div>
      </div>

      {/* Channel description + subscribe button */}
      <div className="px-4 py-4 border-b-[3px] border-[var(--color-border)] flex items-start justify-between gap-4">
        {channel.description ? (
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-3xl">{channel.description}</p>
        ) : (
          <span />
        )}
        <div className="flex-shrink-0">
          <SubscribeButton channelId={id} initialSubscribed={isSubscribed} />
        </div>
      </div>

      {/* Episodes grid */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">قسمت‌ها</h2>

        {episodes.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-12 text-lg">قسمتی موجود نیست</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {episodes.map((ep, i) => (
              <ThumbnailCard
                key={ep.id}
                title={ep.title}
                thumbnail={ep.thumbnail}
                href={`/watch/${ep.id}`}
                channelName={channel.name}
                channelThumbnail={channel.thumbnail}
                channelHref={`/channel/${channel.id}`}
                episodeNumber={ep.order}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
