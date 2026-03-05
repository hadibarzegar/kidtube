import { cookies } from 'next/headers'
import CategoriesClient from './CategoriesClient'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Category {
  id: string
  name: string
  thumbnail: string
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

export default async function CategoriesPage() {
  const categories = await fetchCategories()

  return <CategoriesClient tableData={categories} totalCount={categories.length} />
}
