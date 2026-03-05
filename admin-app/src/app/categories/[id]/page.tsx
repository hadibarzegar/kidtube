import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import CategoryForm from './CategoryForm'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Category {
  id: string
  name: string
  thumbnail: string
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
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/categories">Categories</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isNew ? 'New Category' : category?.name ?? 'Edit'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? 'New Category' : 'Edit Category'}
      </h1>

      <CategoryForm id={isNew ? null : id} defaultName={category?.name ?? ''} defaultThumbnail={category?.thumbnail ?? ''} />
    </div>
  )
}
