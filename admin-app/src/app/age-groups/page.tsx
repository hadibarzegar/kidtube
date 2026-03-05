import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
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

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'min_age', label: 'Min Age', sortable: true, className: 'w-24' },
  { key: 'max_age', label: 'Max Age', sortable: true, className: 'w-24' },
  { key: 'created_at', label: 'Created', sortable: true },
]

export default async function AgeGroupsPage() {
  const ageGroups = await fetchAgeGroups()

  async function handleDelete(id: string) {
    'use server'
    await deleteAgeGroup(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Age Groups</h1>
          <p className="text-sm text-muted-foreground">{ageGroups.length} age groups total</p>
        </div>
        <Button asChild>
          <Link href="/age-groups/new">New Age Group</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={ageGroups}
        onDelete={handleDelete}
        editPath="/age-groups"
        searchPlaceholder="Search age groups..."
      />
    </div>
  )
}
