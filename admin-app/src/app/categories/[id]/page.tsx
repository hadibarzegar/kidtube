import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CategoryForm from './CategoryForm'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Category {
  id: string
  name: string
}

async function fetchCategory(id: string): Promise<Category | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch category: ${res.status}`)
  return res.json()
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params
  const isNew = id === 'new'

  let category: Category | null = null
  if (!isNew) {
    category = await fetchCategory(id)
    if (!category) notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/categories"
          className="text-sm text-slate-600 hover:underline"
        >
          &larr; Back to Categories
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? 'New Category' : `Edit Category: ${category?.name}`}
      </h1>

      <div className="bg-white rounded-md border border-gray-200 p-6 max-w-lg">
        <CategoryForm id={isNew ? null : id} defaultName={category?.name ?? ''} />
      </div>
    </div>
  )
}
