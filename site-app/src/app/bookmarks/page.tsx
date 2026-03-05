import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { Episode } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'

export const metadata = {
  title: 'نشان‌شده‌ها — KidTube',
}

export default async function BookmarksPage() {
  // proxy.ts redirects guests to /login so this page always has a valid token
  const token = await getSiteSession()
  let episodes: Episode[] = []

  if (token) {
    const res = await apiServerAuthFetch('/me/bookmarks', token, { cache: 'no-store' })
    episodes = res.ok ? await res.json() : []
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">نشان‌شده‌ها</h1>

        {episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-faint)]">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-4 text-[var(--color-primary)] opacity-30"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-lg font-medium text-[var(--color-text-muted)] mb-2">
              هنوز ویدیویی را نشان نکرده‌اید
            </p>
            <a
              href="/"
              className="mt-4 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium text-sm transition-colors"
            >
              ویدیوها را کشف کنید
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {episodes.map((ep, i) => (
              <ThumbnailCard
                key={ep.id}
                title={ep.title}
                href={`/watch/${ep.id}`}
                subtitle={`قسمت ${ep.order}`}
                viewCount={ep.view_count}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
