import React from 'react'

interface HorizontalRailProps {
  title: string
  children: React.ReactNode
  viewAllHref?: string
}

export default function HorizontalRail({ title, children, viewAllHref }: HorizontalRailProps) {
  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors"
          >
            مشاهده همه
          </a>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory scrollbar-hide [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
    </section>
  )
}
