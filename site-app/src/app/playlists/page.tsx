import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { Playlist } from '@/lib/types'
import PlaylistCard from '@/components/PlaylistCard'
import PlaylistPageClient from '@/components/PlaylistPageClient'

export const metadata = {
  title: 'لیست‌های پخش — KidTube',
}

export default async function PlaylistsPage() {
  const token = await getSiteSession()
  let playlists: Playlist[] = []

  if (token) {
    const res = await apiServerAuthFetch('/me/playlists', token, { cache: 'no-store' })
    playlists = res.ok ? await res.json() : []
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">لیست‌های پخش</h1>
          <PlaylistPageClient />
        </div>

        {playlists.length === 0 ? (
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <p className="text-lg font-medium text-[var(--color-text-muted)] mb-2">
              هنوز لیست پخشی ایجاد نکرده‌اید
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                episodeCount={pl.episode_ids?.length ?? 0}
                thumbnail={pl.thumbnail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
