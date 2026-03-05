import { Suspense } from 'react'
import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import type { Category, Channel, Episode } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'
import CategoryChips from '@/components/CategoryChips'

interface HomePageProps {
  searchParams: Promise<{ category_id?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const categoryId = params.category_id ?? null

  // Parallel fetch for categories and episodes
  const [categoriesRes, episodesRes] = await Promise.all([
    apiServerFetch('/categories'),
    categoryId
      ? apiServerFetch(`/episodes?category_id=${encodeURIComponent(categoryId)}`)
      : apiServerFetch('/episodes'),
  ])

  const categories: Category[] = categoriesRes.ok ? await categoriesRes.json() : []
  const episodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Fetch channel info for each unique channel_id in episodes
  const channelIds = [...new Set(episodes.map((ep) => ep.channel_id))]
  const channelMap = new Map<string, Channel>()

  if (channelIds.length > 0) {
    const channelResults = await Promise.all(
      channelIds.map(async (id) => {
        const res = await apiServerFetch(`/channels/${id}`)
        if (res.ok) {
          const ch: Channel = await res.json()
          return ch
        }
        return null
      })
    )
    channelResults.forEach((ch) => {
      if (ch) channelMap.set(ch.id, ch)
    })
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Category filter chips */}
      <Suspense fallback={<div className="h-12 px-4 py-2 flex gap-2 overflow-hidden" />}>
        <CategoryChips categories={categories} selectedId={categoryId} />
      </Suspense>

      {/* Video grid */}
      <div className="px-4 md:px-6 py-4 mx-auto max-w-[1800px]">
        {episodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
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
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-faint)]">
            <p className="text-xl">محتوایی یافت نشد</p>
            <p className="text-sm mt-2 text-[var(--color-text-muted)]">
              دسته‌بندی دیگری را امتحان کنید
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
