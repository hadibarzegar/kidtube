'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import ThumbnailCard from '@/components/ThumbnailCard'

interface Channel {
  id: string
  name: string
  description: string
  thumbnail: string
  category_ids: string[]
  age_group_ids: string[]
  created_at: string
  updated_at: string
}

interface Episode {
  id: string
  channel_id: string
  title: string
  description: string
  order: number
  subtitle_url: string
  status: string
  created_at: string
  updated_at: string
}

interface SearchResults {
  channels: Channel[]
  episodes: Episode[]
}

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus()
  }, [])

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
    <div className="min-h-screen bg-white">
      {/* Search input bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative mx-auto max-w-2xl">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
            className="w-full min-h-[48px] pr-10 pl-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            dir="rtl"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults(null)
                inputRef.current?.focus()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
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
      <div className="px-4 py-4 mx-auto max-w-7xl">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-red-500 py-8">{error}</p>
        )}

        {!loading && noResults && (
          <p className="text-center text-gray-500 py-12 text-lg">نتیجه‌ای یافت نشد</p>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4 opacity-40">
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
                <h2 className="text-base font-bold text-gray-700 mb-3">کانال‌ها</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results!.channels.map((ch) => (
                    <ThumbnailCard
                      key={ch.id}
                      title={ch.name}
                      thumbnail={ch.thumbnail}
                      href={`/channel/${ch.id}`}
                      subtitle={ch.description}
                    />
                  ))}
                </div>
              </section>
            )}

            {results!.episodes.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-700 mb-3">قسمت‌ها</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results!.episodes.map((ep) => (
                    <ThumbnailCard
                      key={ep.id}
                      title={ep.title}
                      href={`/watch/${ep.id}`}
                      subtitle={`قسمت ${ep.order}`}
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
