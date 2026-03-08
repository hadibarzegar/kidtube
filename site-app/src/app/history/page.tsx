import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch, apiServerFetch } from '@/lib/api'
import type { Episode, Channel, WatchProgress } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'
import ProgressBar from '@/components/ProgressBar'
import ClearHistoryButton from '@/components/ClearHistoryButton'

export const metadata = {
  title: 'تاریخچه تماشا — KidTube',
}

export default async function HistoryPage() {
  const token = await getSiteSession()
  let watchHistory: (WatchProgress & { episode?: Episode })[] = []
  let episodes: Episode[] = []
  const channelMap = new Map<string, Channel>()

  if (token) {
    const res = await apiServerAuthFetch('/me/watch-history', token, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      // The API may return WatchProgress items with embedded episodes, or just episode references
      if (Array.isArray(data)) {
        watchHistory = data
        // Extract episodes or fetch them
        episodes = data.map((item: any) => item.episode ?? item).filter((e: any) => e?.id)
      }
    }

    // Fetch channel data for each unique channel_id
    const channelIds = [...new Set(episodes.map((ep) => ep.channel_id).filter(Boolean))]
    const channelResults = await Promise.all(
      channelIds.map(async (id) => {
        try {
          const chRes = await apiServerFetch(`/channels/${id}`, { cache: 'no-store' })
          if (chRes.ok) return (await chRes.json()) as Channel
        } catch {}
        return null
      })
    )
    channelResults.forEach((ch) => {
      if (ch) channelMap.set(ch.id, ch)
    })
  }

  // Build a progress map by episode_id
  const progressMap = new Map<string, number>()
  watchHistory.forEach((wp) => {
    if (wp.episode_id && wp.progress_pct !== undefined) {
      progressMap.set(wp.episode_id, wp.progress_pct)
    }
  })

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">تاریخچه تماشا</h1>
          {episodes.length > 0 && <ClearHistoryButton />}
        </div>

        {episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-faint)]">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-4 text-[var(--color-primary)] opacity-30"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-lg font-medium text-[var(--color-text-muted)] mb-2">
              هنوز ویدیویی تماشا نکرده‌اید
            </p>
            <a
              href="/"
              className="mt-4 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium text-sm transition-colors"
            >
              ویدیوها را کشف کنید
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {episodes.map((ep, i) => {
              const channel = channelMap.get(ep.channel_id)
              const pct = progressMap.get(ep.id) ?? 0
              return (
                <div key={ep.id} className="relative">
                  <ThumbnailCard
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
                  <ProgressBar progressPct={pct} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
