import { cookies } from 'next/headers'
import Link from 'next/link'
import DataTable from '@/components/DataTable'
import { deleteAgeGroup } from '@/app/actions/age-groups'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface AgeGroup {
  id: string
  name: string
  min_age: number
  max_age: number
  created_at: string
}

async function fetchAgeGroups(): Promise<AgeGroup[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (!res.ok) return []
  return res.json()
}

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'min_age', label: 'Min Age', sortable: true },
  { key: 'max_age', label: 'Max Age', sortable: true },
  { key: 'created_at', label: 'Created At', sortable: true },
]

export default async function AgeGroupsPage() {
  const ageGroups = await fetchAgeGroups()

  async function handleDelete(id: string) {
    'use server'
    await deleteAgeGroup(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Age Groups</h1>
        <Link
          href="/age-groups/new"
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
        >
          New Age Group
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={ageGroups}
        onDelete={handleDelete}
        editPath="/age-groups"
      />
    </div>
  )
}
