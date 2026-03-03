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
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Back button — chevron pointing right (RTL: right = back) */}
        <a
          href="/browse"
          className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium mb-6 no-underline transition-colors min-h-[44px]"
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

        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">{categoryName}</h1>

        {channels.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-16 text-lg">کانالی در این دسته‌بندی موجود نیست</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {channels.map((ch, i) => (
              <ThumbnailCard
                key={ch.id}
                title={ch.name}
                thumbnail={ch.thumbnail}
                href={`/channel/${ch.id}`}
                subtitle={ch.description}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
