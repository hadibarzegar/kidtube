import Link from 'next/link'

export default function TopNavbar() {
  return (
    <header className="hidden md:flex items-center bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl w-full flex items-center justify-between">
        {/* Logo — right side in RTL */}
        <Link href="/" className="text-2xl font-bold text-blue-500 no-underline">
          کیدتیوب
        </Link>

        {/* Navigation links — left side in RTL */}
        <nav className="flex gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors no-underline"
          >
            خانه
          </Link>
          <Link
            href="/browse"
            className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors no-underline"
          >
            دسته‌بندی‌ها
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors no-underline"
          >
            جستجو
          </Link>
        </nav>
      </div>
    </header>
  )
}
