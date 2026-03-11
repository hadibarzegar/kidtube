interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`kidtube-skeleton rounded-[var(--clay-radius)] ${className}`}
    />
  )
}

export function ThumbnailCardSkeleton() {
  return (
    <div>
      {/* Thumbnail placeholder */}
      <Skeleton className="aspect-video w-full" />
      {/* Info area */}
      <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-3 px-0.5">
        {/* Channel avatar — hidden on small mobile to match ThumbnailCard */}
        <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 hidden sm:block" />
        {/* Text lines */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 sm:h-4 w-full rounded-lg" />
          <Skeleton className="h-2.5 sm:h-3 w-2/3 rounded-lg mt-1.5 sm:mt-2" />
        </div>
      </div>
    </div>
  )
}

export function MiniCardSkeleton() {
  return (
    <div className="flex gap-3 items-center">
      {/* Small thumbnail */}
      <Skeleton className="w-40 aspect-video rounded-[var(--clay-radius-sm)] flex-shrink-0" />
      {/* Text lines */}
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg mt-2" />
      </div>
    </div>
  )
}
