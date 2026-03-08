interface SectionHeaderProps {
  title: string
  seeAllHref?: string
}

export default function SectionHeader({ title, seeAllHref }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
      {seeAllHref && (
        <a
          href={seeAllHref}
          className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          مشاهده همه &larr;
        </a>
      )}
    </div>
  )
}
