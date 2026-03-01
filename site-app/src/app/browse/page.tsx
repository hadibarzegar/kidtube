import { apiServerFetch } from '@/lib/api'
import type { Category } from '@/lib/types'

// Cycle through accent color classes for category cards
const accentColors = [
  'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'bg-pink-100 text-pink-800 hover:bg-pink-200',
  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'bg-green-100 text-green-800 hover:bg-green-200',
  'bg-purple-100 text-purple-800 hover:bg-purple-200',
  'bg-orange-100 text-orange-800 hover:bg-orange-200',
]

export default async function BrowsePage() {
  const res = await apiServerFetch('/categories')
  const categories: Category[] = res.ok ? await res.json() : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">دسته‌بندی‌ها</h1>

        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-16 text-lg">دسته‌بندی‌ای موجود نیست</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <a
                key={cat.id}
                href={`/browse/${cat.id}`}
                className={[
                  'min-h-[120px] rounded-2xl shadow-sm flex items-center justify-center p-4 text-center font-bold text-lg transition-all duration-200 no-underline hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                  accentColors[idx % accentColors.length],
                ].join(' ')}
              >
                {cat.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
