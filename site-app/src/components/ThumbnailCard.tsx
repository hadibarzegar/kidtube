import { resolveImageUrl } from '@/lib/image'

const pastelColors = [
  'bg-[#FDBCB4]', // peach
  'bg-[#ADD8E6]', // baby blue
  'bg-[#98FF98]', // mint
  'bg-[#E6E6FA]', // lilac
  'bg-[#FFE4A0]', // yellow
  'bg-[#FFB3D9]', // pink
]

interface ThumbnailCardProps {
  title: string
  thumbnail?: string
  href: string
  index?: number
  channelName?: string
  channelThumbnail?: string
  channelHref?: string
  episodeNumber?: number
  subtitle?: string
}

export default function ThumbnailCard({
  title,
  thumbnail,
  href,
  index = 0,
  channelName,
  channelThumbnail,
  channelHref,
  episodeNumber,
  subtitle,
}: ThumbnailCardProps) {
  const resolvedThumbnail = resolveImageUrl(thumbnail)
  const resolvedChannelThumb = resolveImageUrl(channelThumbnail)
  const pastelBg = pastelColors[index % pastelColors.length]
  const channelInitial = channelName?.charAt(0) || title.charAt(0)

  return (
    <div className="group">
      {/* Thumbnail */}
      <a href={href} className="block no-underline">
        <div className="aspect-video relative rounded-[var(--clay-radius)] overflow-hidden transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[2px] group-hover:shadow-[var(--clay-shadow-hover)] group-active:translate-y-[1px] group-active:scale-[0.98]">
          {resolvedThumbnail ? (
            <img
              src={resolvedThumbnail}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${pastelBg} flex items-center justify-center`}>
              <span className="text-white text-3xl font-bold opacity-70 drop-shadow-sm">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </a>

      {/* Info area */}
      <div className="flex gap-3 mt-3 px-0.5">
        {/* Channel avatar */}
        {channelName && (
          <a
            href={channelHref || href}
            className="flex-shrink-0 no-underline"
          >
            {resolvedChannelThumb ? (
              <img
                src={resolvedChannelThumb}
                alt={channelName}
                className="w-9 h-9 rounded-full object-cover border-2 border-[var(--color-border)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--color-secondary-light)] flex items-center justify-center border-2 border-[var(--color-secondary)]">
                <span className="text-[var(--color-secondary)] font-bold text-sm">
                  {channelInitial}
                </span>
              </div>
            )}
          </a>
        )}

        {/* Text info */}
        <div className="min-w-0 flex-1">
          <a href={href} className="no-underline">
            <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug">
              {title}
            </p>
          </a>
          {channelName && (
            <a
              href={channelHref || href}
              className="no-underline block"
            >
              <p className="text-xs text-[var(--color-text-muted)] mt-1 hover:text-[var(--color-text)] transition-colors">
                {channelName}
              </p>
            </a>
          )}
          {episodeNumber !== undefined && episodeNumber > 0 && (
            <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
              قسمت {episodeNumber}
            </p>
          )}
          {!channelName && subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
