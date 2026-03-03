import { Suspense } from 'react'
import SearchOverlay from '@/components/SearchOverlay'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)]" />}>
      <SearchOverlay />
    </Suspense>
  )
}
