import SectionHeader from '@/components/SectionHeader'

interface HorizontalSectionProps {
  title: string
  seeAllHref?: string
  children: React.ReactNode
}

export default function HorizontalSection({ title, seeAllHref, children }: HorizontalSectionProps) {
  return (
    <section className="mb-8">
      <SectionHeader title={title} seeAllHref={seeAllHref} />
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-2">
          {children}
        </div>
      </div>
    </section>
  )
}
