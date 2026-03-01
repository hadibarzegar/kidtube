import { apiServerFetch } from '@/lib/api'
import type { Channel, Category } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = await params

  // Fetch all categories to find the matching name, and channels in parallel
  const [categoriesRes, channelsRes] = await Promise.all([
    apiServerFetch('/categories'),
    apiServerFetch(`/channels?category_id=${encodeURIComponent(categoryId)}`),
  ])

  const categories: Category[] = categoriesRes.ok ? await categoriesRes.json() : []
  const channels: Channel[] = channelsRes.ok ? await channelsRes.json() : []

  const category = categories.find((c) => c.id === categoryId)
  const categoryName = category?.name ?? 'دسته‌بندی'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Back button — chevron pointing right (RTL: right = back) */}
        <a
          href="/browse"
          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium mb-6 no-underline transition-colors min-h-[44px]"
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
          <span>بازگشت به دسته‌بندی‌ها</span>
        </a>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{categoryName}</h1>

        {channels.length === 0 ? (
          <p className="text-center text-gray-500 py-16 text-lg">کانالی در این دسته‌بندی موجود نیست</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {channels.map((ch) => (
              <ThumbnailCard
                key={ch.id}
                title={ch.name}
                thumbnail={ch.thumbnail}
                href={`/channel/${ch.id}`}
                subtitle={ch.description}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
