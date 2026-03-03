'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/types'

interface CategoryChipsProps {
  categories: Category[]
  selectedId: string | null
}

export default function CategoryChips({ categories, selectedId }: CategoryChipsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === null) {
      params.delete('category_id')
    } else {
      params.set('category_id', id)
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  const tabs = [
    { id: null, label: 'همه' },
    ...categories.map((cat) => ({ id: cat.id, label: cat.name })),
  ]

  return (
    <div className="sticky top-[56px] z-20 clay-frosted border-b border-[var(--color-border)] py-2">
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        {tabs.map((tab) => {
          const isActive = tab.id === selectedId
          return (
            <button
              key={tab.id ?? 'all'}
              onClick={() => handleSelect(tab.id)}
              className={[
                'min-h-[36px] px-4 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer border-[2px]',
                isActive
                  ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-text)] hover:bg-[var(--color-primary-hover)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
