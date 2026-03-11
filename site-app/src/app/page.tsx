import { Suspense } from 'react'
import { apiServerFetch, apiServerAuthFetch } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSession } from '@/lib/session'
import type { Category, Channel, Episode, SiteUser } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'
import CategoryChips from '@/components/CategoryChips'
import HorizontalSection from '@/components/HorizontalSection'
import StreakCounter from '@/components/StreakCounter'

interface HomePageProps {
  searchParams: Promise<{ category_id?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const categoryId = params.category_id ?? null

  const user = await getCurrentUser()
  const token = user ? await getSiteSession() : null

  // Determine maturity filter from active child profile
  let maturityParam = ''
  let activeChildId: string | null = null
  if (token) {
    const meRes = await apiServerAuthFetch('/me', token)
    if (meRes.ok) {
      const meData: SiteUser = await meRes.json()
      activeChildId = meData.active_child_id ?? null
      if (meData.active_child_id && meData.child_profiles) {
        const activeChild = meData.child_profiles.find((c) => c.id === meData.active_child_id)
        if (activeChild && activeChild.maturity_level && activeChild.maturity_level !== 'all-ages') {
          maturityParam = `?max_maturity=${encodeURIComponent(activeChild.maturity_level)}`
        }
      }
    }
  }

  // Parallel fetch for categories, episodes, trending, new, and optionally continue watching
  const fetches: Promise<Response>[] = [
    apiServerFetch('/categories'),
    categoryId
      ? apiServerFetch(`/episodes?category_id=${encodeURIComponent(categoryId)}`)
      : apiServerFetch('/episodes'),
    apiServerFetch(`/discover/trending${maturityParam}`),
    apiServerFetch(`/discover/new${maturityParam}`),
  ]
  if (token) {
    fetches.push(apiServerAuthFetch(`/me/continue-watching${maturityParam}`, token, { cache: 'no-store' }))
  }

  const results = await Promise.all(fetches)

  const categories: Category[] = results[0].ok ? await results[0].json() : []
  const episodes: Episode[] = results[1].ok ? await results[1].json() : []
  const trending: Episode[] = results[2].ok ? await results[2].json() : []
  const newEpisodes: Episode[] = results[3].ok ? await results[3].json() : []

  interface ContinueWatchingItem {
    id: string
    channel_id: string
    title: string
    thumbnail: string
    order: number
    view_count: number
    progress_pct: number
    progress_sec: number
    duration_sec: number
    [key: string]: unknown
  }
  let continueWatching: ContinueWatchingItem[] = []
  if (token && results[4]?.ok) {
    continueWatching = await results[4].json()
  }

  // Fetch streak for active child
  let currentStreak = 0
  if (token && activeChildId) {
    const streakRes = await apiServerAuthFetch(
      `/me/children/${activeChildId}/streak`,
      token,
      { cache: 'no-store' }
    )
    if (streakRes.ok) {
      const streakData = await streakRes.json()
      currentStreak = streakData.current_streak ?? 0
    }
  }

  // Fetch channel info for all unique channel_ids across all sections
  const allEpisodes = [...episodes, ...trending, ...newEpisodes]
  const channelIds = [...new Set(allEpisodes.map((ep) => ep.channel_id))]
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

      <div className="px-4 md:px-6 py-4 mx-auto max-w-[1800px] space-y-8">
        {/* Streak Counter */}
        {currentStreak > 0 && (
          <div className="flex justify-start">
            <StreakCounter currentStreak={currentStreak} />
          </div>
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <HorizontalSection title="ادامه تماشا" seeAllHref="/history">
            {continueWatching.map((item, i) => (
              <div key={item.id} className="min-w-[160px] w-[42vw] max-w-[280px] flex-shrink-0 snap-start">
                <ThumbnailCard
                  title={item.title}
                  thumbnail={item.thumbnail}
                  href={`/watch/${item.id}`}
                  index={i}
                  viewCount={item.view_count}
                />
              </div>
            ))}
          </HorizontalSection>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <HorizontalSection title="پرطرفدار">
            {trending.map((ep, i) => {
              const channel = channelMap.get(ep.channel_id)
              return (
                <div key={ep.id} className="min-w-[160px] w-[42vw] max-w-[280px] flex-shrink-0 snap-start">
                  <ThumbnailCard
                    title={ep.title}
                    thumbnail={ep.thumbnail}
                    href={`/watch/${ep.id}`}
                    index={i}
                    channelName={channel?.name}
                    channelThumbnail={channel?.thumbnail}
                    channelHref={channel ? `/channel/${channel.id}` : undefined}
                    viewCount={ep.view_count}
                  />
                </div>
              )
            })}
          </HorizontalSection>
        )}

        {/* New Episodes */}
        {newEpisodes.length > 0 && (
          <HorizontalSection title="تازه‌ها">
            {newEpisodes.map((ep, i) => {
              const channel = channelMap.get(ep.channel_id)
              return (
                <div key={ep.id} className="min-w-[160px] w-[42vw] max-w-[280px] flex-shrink-0 snap-start">
                  <ThumbnailCard
                    title={ep.title}
                    thumbnail={ep.thumbnail}
                    href={`/watch/${ep.id}`}
                    index={i}
                    channelName={channel?.name}
                    channelThumbnail={channel?.thumbnail}
                    channelHref={channel ? `/channel/${channel.id}` : undefined}
                    viewCount={ep.view_count}
                  />
                </div>
              )
            })}
          </HorizontalSection>
        )}

        {/* All Episodes / Category filtered grid */}
        {episodes.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 font-display">
              {categoryId ? 'نتایج' : 'همه ویدیوها'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
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
