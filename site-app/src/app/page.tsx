import { Suspense } from 'react'
import { apiServerFetch } from '@/lib/api'
import type { Category, AgeGroup, Channel, Episode } from '@/lib/types'
import HorizontalRail from '@/components/HorizontalRail'
import ThumbnailCard from '@/components/ThumbnailCard'
import AgeFilterTabs from '@/components/AgeFilterTabs'

interface HomePageProps {
  searchParams: Promise<{ age_group_id?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const ageGroupId = params.age_group_id ?? null

  // Parallel fetch for initial data
  const [categoriesRes, ageGroupsRes, episodesRes] = await Promise.all([
    apiServerFetch('/categories'),
    apiServerFetch('/age-groups'),
    apiServerFetch('/episodes'),
  ])

  const categories: Category[] = categoriesRes.ok ? await categoriesRes.json() : []
  const ageGroups: AgeGroup[] = ageGroupsRes.ok ? await ageGroupsRes.json() : []
  const allEpisodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  // Featured: take first 10 episodes (sorted by order asc from API)
  const featuredEpisodes = allEpisodes.slice(0, 10)

  // Fetch channels per category, filtered by age group if selected
  const categoryChannelPairs = await Promise.all(
    categories.map(async (cat) => {
      const url = ageGroupId
        ? `/channels?category_id=${cat.id}&age_group_id=${encodeURIComponent(ageGroupId)}`
        : `/channels?category_id=${cat.id}`
      const res = await apiServerFetch(url)
      const channels: Channel[] = res.ok ? await res.json() : []
      return { category: cat, channels }
    })
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Age filter tabs — requires Suspense since AgeFilterTabs uses useSearchParams */}
      <Suspense fallback={<div className="h-14 px-4 py-3 flex gap-2 overflow-hidden" />}>
        <AgeFilterTabs ageGroups={ageGroups} selectedId={ageGroupId} />
      </Suspense>

      {/* Featured rail */}
      {featuredEpisodes.length > 0 && (
        <HorizontalRail title="ویژه">
          {featuredEpisodes.map((ep) => (
            <ThumbnailCard
              key={ep.id}
              title={ep.title}
              href={`/watch/${ep.id}`}
              subtitle={`قسمت ${ep.order}`}
            />
          ))}
        </HorizontalRail>
      )}

      {/* Per-category channel rails */}
      {categoryChannelPairs.map(({ category, channels }) => {
        if (channels.length === 0) return null
        return (
          <HorizontalRail
            key={category.id}
            title={category.name}
            viewAllHref={`/browse/${category.id}`}
          >
            {channels.map((ch) => (
              <ThumbnailCard
                key={ch.id}
                title={ch.name}
                thumbnail={ch.thumbnail}
                href={`/channel/${ch.id}`}
                subtitle={ch.description}
              />
            ))}
          </HorizontalRail>
        )
      })}

      {/* Empty state when no content matches filter */}
      {categoryChannelPairs.every(({ channels }) => channels.length === 0) &&
        featuredEpisodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <p className="text-xl">محتوایی یافت نشد</p>
            <p className="text-sm mt-2">فیلتر سنی دیگری را امتحان کنید</p>
          </div>
        )}
    </div>
  )
}
