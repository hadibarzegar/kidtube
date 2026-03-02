'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface AgeGroup {
  id: string
  name: string
  min_age: number
  max_age: number
  created_at: string
  updated_at: string
}

interface AgeFilterTabsProps {
  ageGroups: AgeGroup[]
  selectedId: string | null
}

export default function AgeFilterTabs({ ageGroups, selectedId }: AgeFilterTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === null) {
      params.delete('age_group_id')
    } else {
      params.set('age_group_id', id)
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  const tabs = [
    { id: null, label: 'همه' },
    ...ageGroups.map((ag) => ({ id: ag.id, label: ag.name })),
  ]

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide [-webkit-overflow-scrolling:touch]">
      {tabs.map((tab) => {
        const isActive = tab.id === selectedId
        return (
          <button
            key={tab.id ?? 'all'}
            onClick={() => handleSelect(tab.id)}
            className={[
              'min-h-[48px] px-5 rounded-2xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer border-[3px]',
              isActive
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary-light)] hover:bg-[var(--color-primary-hover)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
