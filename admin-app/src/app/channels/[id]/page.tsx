import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ChannelForm from './ChannelForm'
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

interface Channel {
  id: string
  name: string
  description: string
  thumbnail: string
  category_ids: string[]
  age_group_ids: string[]
}

interface Category {
  id: string
  name: string
}

interface AgeGroup {
  id: string
  name: string
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchChannel(id: string): Promise<Channel | null> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/channels/${id}`, { headers, cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch channel: ${res.status}`)
  return res.json()
}

async function fetchCategories(): Promise<Category[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories`, { headers, cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function fetchAgeGroups(): Promise<AgeGroup[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups`, { headers, cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChannelPage({ params }: Props) {
  const { id } = await params
  const isNew = id === 'new'

  const [channel, categories, ageGroups] = await Promise.all([
    isNew ? Promise.resolve(null) : fetchChannel(id),
    fetchCategories(),
    fetchAgeGroups(),
  ])

  if (!isNew && !channel) notFound()

  const defaultValues = {
    name: channel?.name ?? '',
    description: channel?.description ?? '',
    thumbnail: channel?.thumbnail ?? '',
    categoryId: channel?.category_ids?.[0] ?? '',
    ageGroupId: channel?.age_group_ids?.[0] ?? '',
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/channels">Channels</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isNew ? 'New Channel' : channel?.name ?? 'Edit'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? 'New Channel' : 'Edit Channel'}
      </h1>

      <ChannelForm
        id={isNew ? null : id}
        defaultValues={defaultValues}
        categories={categories}
        ageGroups={ageGroups}
      />
    </div>
  )
}
