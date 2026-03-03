'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import ThumbnailCard from '@/components/ThumbnailCard'
import type { Channel, Episode } from '@/lib/types'

interface SearchResults {
  channels: Channel[]
  episodes: Episode[]
}

export default function SearchOverlay() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) {
        setError('خطا در جستجو')
        setResults(null)
        return
      }
      const data: SearchResults = await res.json()
      setResults(data)
    } catch {
      setError('خطا در اتصال به سرور')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-search if URL has ?q=
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery, doSearch])

  // Auto-focus input on mount (mobile)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 300)
  }

  const hasResults =
    results && (results.channels.length > 0 || results.episodes.length > 0)
  const noResults =
    results && results.channels.length === 0 && results.episodes.length === 0

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Search input */}
      <div className="px-4 py-3">
        <div className="relative mx-auto max-w-2xl">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="جستجو..."
            className="w-full min-h-[48px] pr-10 pl-4 clay-input text-sm font-medium"
            dir="rtl"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults(null)
                inputRef.current?.focus()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
              aria-label="پاک کردن جستجو"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="px-4 py-4 mx-auto max-w-[1800px]">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-[var(--color-error)] py-8">{error}</p>
        )}

        {!loading && noResults && (
          <p className="text-center text-[var(--color-text-muted)] py-12 text-lg">نتیجه‌ای یافت نشد</p>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-faint)]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4 opacity-30 text-[var(--color-primary)]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-lg">برای جستجو تایپ کنید</p>
          </div>
        )}

        {!loading && hasResults && (
          <>
            {results!.channels.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-bold text-[var(--color-text)] mb-3">کانال‌ها</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                  {results!.channels.map((ch, i) => (
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
              </section>
            )}

            {results!.episodes.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[var(--color-text)] mb-3">قسمت‌ها</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                  {results!.episodes.map((ep, i) => (
                    <ThumbnailCard
                      key={ep.id}
                      title={ep.title}
                      thumbnail={ep.thumbnail}
                      href={`/watch/${ep.id}`}
                      subtitle={`قسمت ${ep.order}`}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
