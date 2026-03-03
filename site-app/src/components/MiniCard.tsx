import { resolveImageUrl } from '@/lib/image'

interface MiniCardProps {
  title: string
  thumbnail?: string
  href: string
  channelName?: string
  episodeNumber?: number
}

export default function MiniCard({ title, thumbnail, href, channelName, episodeNumber }: MiniCardProps) {
  const resolvedThumbnail = resolveImageUrl(thumbnail)

  return (
    <a href={href} className="flex gap-2 no-underline group">
      {/* Thumbnail */}
      <div className="w-[168px] flex-shrink-0 aspect-video relative rounded-[var(--clay-radius-xs)] overflow-hidden group-hover:shadow-[var(--clay-shadow)] transition-shadow">
        {resolvedThumbnail ? (
          <img
            src={resolvedThumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-secondary-light)] flex items-center justify-center">
            <span className="text-[var(--color-secondary)] text-xl font-bold opacity-70">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </p>
        {channelName && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
            {channelName}
          </p>
        )}
        {episodeNumber !== undefined && episodeNumber > 0 && (
          <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
            قسمت {episodeNumber}
          </p>
        )}
      </div>
    </a>
  )
}
