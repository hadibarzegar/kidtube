import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { Channel } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'

export const metadata = {
  title: 'کانال‌های من — کیدتیوب',
}

export default async function SubscriptionsPage() {
  // proxy.ts redirects guests to /login so this page always has a valid token
  const token = await getSiteSession()
  let channels: Channel[] = []

  if (token) {
    const res = await apiServerAuthFetch('/me/subscriptions', token, { cache: 'no-store' })
    channels = res.ok ? await res.json() : []
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">کانال‌های من</h1>

        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-4 text-gray-300"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-lg font-medium text-gray-500 mb-2">
              هنوز کانالی را دنبال نکرده‌اید
            </p>
            <a
              href="/browse"
              className="mt-4 text-blue-500 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              کانال‌ها را کشف کنید
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {channels.map((ch) => (
              <ThumbnailCard
                key={ch.id}
                title={ch.name}
                thumbnail={ch.thumbnail}
                href={`/channel/${ch.id}`}
                subtitle={ch.description}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
