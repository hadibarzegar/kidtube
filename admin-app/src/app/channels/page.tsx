import { cookies } from 'next/headers'
import Link from 'next/link'
import DataTable from '@/components/DataTable'
import { deleteChannel } from '@/app/actions/channels'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Channel {
  id: string
  name: string
  description: string
  thumbnail: string
  category_ids: string[]
  age_group_ids: string[]
  created_at: string
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

async function fetchChannels(): Promise<Channel[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/channels`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchCategories(): Promise<Category[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchAgeGroups(): Promise<AgeGroup[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'categoryName', label: 'Category', sortable: true },
  { key: 'ageGroupName', label: 'Age Group', sortable: true },
  { key: 'created_at', label: 'Created At', sortable: true },
]

export default async function ChannelsPage() {
  const [channels, categories, ageGroups] = await Promise.all([
    fetchChannels(),
    fetchCategories(),
    fetchAgeGroups(),
  ])

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const ageGroupMap = Object.fromEntries(ageGroups.map((ag) => [ag.id, ag.name]))

  const tableData = channels.map((ch) => ({
    ...ch,
    categoryName: ch.category_ids?.map((id) => categoryMap[id]).filter(Boolean).join(', ') || '—',
    ageGroupName: ch.age_group_ids?.map((id) => ageGroupMap[id]).filter(Boolean).join(', ') || '—',
  }))

  async function handleDelete(id: string) {
    'use server'
    await deleteChannel(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
        <Link
          href="/admin/channels/new"
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
        >
          New Channel
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        onDelete={handleDelete}
        editPath="/admin/channels"
      />
    </div>
  )
}
