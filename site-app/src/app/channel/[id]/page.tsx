import Image from 'next/image'
import { apiServerFetch } from '@/lib/api'
import type { Channel, Episode } from '@/lib/types'
import ThumbnailCard from '@/components/ThumbnailCard'

interface ChannelPageProps {
  params: Promise<{ id: string }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params

  const [channelRes, episodesRes] = await Promise.all([
    apiServerFetch(`/channels/${encodeURIComponent(id)}`),
    apiServerFetch(`/episodes?channel_id=${encodeURIComponent(id)}`),
  ])

  if (!channelRes.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-16">
          <p className="text-2xl font-bold text-gray-400 mb-2">کانال یافت نشد</p>
          <a href="/" className="text-blue-500 hover:underline">بازگشت به خانه</a>
        </div>
      </div>
    )
  }

  const channel: Channel = await channelRes.json()
  const episodes: Episode[] = episodesRes.ok ? await episodesRes.json() : []

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <div className="px-4 pt-4">
        <a
          href="/browse"
          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium no-underline transition-colors min-h-[44px]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>بازگشت</span>
        </a>
      </div>

      {/* Channel hero / banner */}
      <div className="relative w-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 aspect-[3/1] overflow-hidden">
        {channel.thumbnail ? (
          <Image
            src={channel.thumbnail}
            alt={channel.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-6xl font-bold opacity-60">
              {channel.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 right-0 p-4">
          <h1 className="text-white text-2xl font-bold drop-shadow">{channel.name}</h1>
        </div>
      </div>

      {/* Channel description */}
      {channel.description && (
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">{channel.description}</p>
        </div>
      )}

      {/* Episodes grid */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">قسمت‌ها</h2>

        {episodes.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-lg">قسمتی موجود نیست</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {episodes.map((ep) => (
              <ThumbnailCard
                key={ep.id}
                title={ep.title}
                href={`/watch/${ep.id}`}
                subtitle={`قسمت ${ep.order}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
