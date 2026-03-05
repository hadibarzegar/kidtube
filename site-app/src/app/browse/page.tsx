import { apiServerFetch } from '@/lib/api'
import { resolveImageUrl } from '@/lib/image'
import type { Category } from '@/lib/types'

// Cycle through pastel colors for category cards
const pastelColors = [
  { bg: 'bg-[#FDBCB4]', text: 'text-[#7A3A30]', border: 'border-[#E8A69C]' },
  { bg: 'bg-[#ADD8E6]', text: 'text-[#2A5F71]', border: 'border-[#8DC0D0]' },
  { bg: 'bg-[#98FF98]', text: 'text-[#2D6B2D]', border: 'border-[#78D878]' },
  { bg: 'bg-[#E6E6FA]', text: 'text-[#4A4A6A]', border: 'border-[#C6C6DA]' },
  { bg: 'bg-[#FFE4A0]', text: 'text-[#6B5A20]', border: 'border-[#E0C880]' },
  { bg: 'bg-[#FFB3D9]', text: 'text-[#7A3055]', border: 'border-[#E093B9]' },
]

export default async function BrowsePage() {
  const res = await apiServerFetch('/categories')
  const categories: Category[] = res.ok ? await res.json() : []

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">دسته‌بندی‌ها</h1>

        {categories.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-16 text-lg">دسته‌بندی‌ای موجود نیست</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => {
              const color = pastelColors[idx % pastelColors.length]
              const thumb = resolveImageUrl(cat.thumbnail)
              return (
                <a
                  key={cat.id}
                  href={`/browse/${cat.id}`}
                  className={[
                    'relative min-h-[120px] rounded-[20px] border-[3px] flex items-center justify-center p-4 text-center font-bold text-lg no-underline cursor-pointer overflow-hidden',
                    'shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),4px_4px_10px_rgba(0,0,0,0.08)]',
                    'transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
                    'hover:-translate-y-[3px] hover:shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),6px_8px_16px_rgba(0,0,0,0.12)]',
                    'active:translate-y-[1px] active:scale-[0.97]',
                    thumb ? 'border-[var(--color-border)]' : `${color.bg} ${color.border}`,
                    thumb ? 'text-white' : color.text,
                  ].join(' ')}
                >
                  {thumb && (
                    <>
                      <img src={thumb} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40" />
                    </>
                  )}
                  <span className="relative z-10 drop-shadow-sm">{cat.name}</span>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
