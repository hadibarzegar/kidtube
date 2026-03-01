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
              'min-h-[48px] px-5 rounded-full font-medium text-sm whitespace-nowrap flex-shrink-0 transition-colors duration-200 cursor-pointer',
              isActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
