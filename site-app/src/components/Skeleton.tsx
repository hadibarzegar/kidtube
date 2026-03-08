interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--color-border)] rounded-[var(--clay-radius)] ${className}`}
    />
  )
}

export function ThumbnailCardSkeleton() {
  return (
    <div>
      {/* Thumbnail placeholder */}
      <Skeleton className="aspect-video w-full" />
      {/* Info area */}
      <div className="flex gap-3 mt-3 px-0.5">
        {/* Channel avatar */}
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        {/* Text lines */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-3 w-2/3 rounded-lg mt-2" />
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
