import Image from 'next/image'

interface ThumbnailCardProps {
  title: string
  thumbnail?: string
  href: string
  subtitle?: string
}

export default function ThumbnailCard({ title, thumbnail, href, subtitle }: ThumbnailCardProps) {
  return (
    <a
      href={href}
      className="block min-w-[140px] min-h-[60px] snap-start flex-shrink-0 w-[180px] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] no-underline"
    >
      <div className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="aspect-video bg-gray-100 relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="180px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white text-3xl font-bold opacity-60">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="bg-white px-2 pb-2 pt-2 rounded-b-2xl">
          <p className="text-sm font-bold line-clamp-2 text-gray-900 leading-snug">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>
    </a>
  )
}
