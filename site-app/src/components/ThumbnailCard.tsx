import Image from 'next/image'

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
  subtitle?: string
  index?: number
}

export default function ThumbnailCard({ title, thumbnail, href, subtitle, index = 0 }: ThumbnailCardProps) {
  const pastelBg = pastelColors[index % pastelColors.length]

  return (
    <a
      href={href}
      className="block min-w-[140px] min-h-[60px] snap-start flex-shrink-0 w-[180px] no-underline group"
    >
      <div className="rounded-[20px] overflow-hidden border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),4px_4px_10px_rgba(0,0,0,0.08)] transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[3px] group-hover:shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.04),6px_8px_16px_rgba(0,0,0,0.12)] group-hover:border-[var(--color-primary)] group-active:translate-y-[1px] group-active:scale-[0.97] cursor-pointer">
        <div className="aspect-video relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="180px"
            />
          ) : (
            <div className={`w-full h-full ${pastelBg} flex items-center justify-center`}>
              <span className="text-white text-3xl font-bold opacity-70 drop-shadow-sm">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="px-2.5 pb-2.5 pt-2">
          <p className="text-sm font-bold line-clamp-2 text-[var(--color-text)] leading-snug">{title}</p>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>
    </a>
  )
}
