import { cookies } from 'next/headers'
import Link from 'next/link'
import DataTable from '@/components/DataTable'
import { deleteCategory } from '@/app/actions/categories'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Category {
  id: string
  name: string
  created_at: string
  updated_at: string
}

async function fetchCategories(): Promise<Category[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (!res.ok) return []
  return res.json()
}

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'created_at', label: 'Created At', sortable: true },
]

export default async function CategoriesPage() {
  const categories = await fetchCategories()

  async function handleDelete(id: string) {
    'use server'
    await deleteCategory(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link
          href="/categories/new"
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
        >
          New Category
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        onDelete={handleDelete}
        editPath="/categories"
      />
    </div>
  )
}
