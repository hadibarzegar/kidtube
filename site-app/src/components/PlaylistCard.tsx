import { resolveImageUrl } from '@/lib/image'
import type { Playlist } from '@/lib/types'

interface PlaylistCardProps {
  playlist: Playlist
  episodeCount: number
  thumbnail?: string
}

const pastelColors = [
  'bg-[#FDBCB4]',
  'bg-[#ADD8E6]',
  'bg-[#98FF98]',
  'bg-[#E6E6FA]',
  'bg-[#FFE4A0]',
  'bg-[#FFB3D9]',
]

export default function PlaylistCard({ playlist, episodeCount, thumbnail }: PlaylistCardProps) {
  const resolvedThumb = resolveImageUrl(thumbnail)
  const pastelBg = pastelColors[playlist.title.charCodeAt(0) % pastelColors.length]

  return (
    <a href={`/playlists/${playlist.id}`} className="group block no-underline">
      {/* Stacked card effect */}
      <div className="relative">
        {/* Back layers for stack effect */}
        <div className="absolute inset-x-2 -top-2 h-4 rounded-t-[var(--clay-radius)] bg-[var(--color-surface)] opacity-40" />
        <div className="absolute inset-x-1 -top-1 h-4 rounded-t-[var(--clay-radius)] bg-[var(--color-surface)] opacity-60" />

        {/* Main card */}
        <div className="relative aspect-video rounded-[var(--clay-radius)] overflow-hidden transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[2px] group-hover:shadow-[var(--clay-shadow-hover)] group-active:translate-y-[1px] group-active:scale-[0.98]">
          {resolvedThumb ? (
            <img
              src={resolvedThumb}
              alt={playlist.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${pastelBg} flex items-center justify-center`}>
              <span className="text-white text-3xl font-bold opacity-70 drop-shadow-sm">
                {playlist.title.charAt(0)}
              </span>
            </div>
          )}
          {/* Episode count badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">
            {episodeCount.toLocaleString('fa-IR')} ویدیو
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-3 px-0.5">
        <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug">
          {playlist.title}
        </p>
        {playlist.description && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
            {playlist.description}
          </p>
        )}
      </div>
    </a>
  )
}
