import { cookies } from 'next/headers'
import DataTable from '@/components/DataTable'
import type { Column } from '@/components/DataTable'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface User {
  id: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

async function fetchUsers(): Promise<User[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/users`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

const columns: Column[] = [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'created_at', label: 'Registered', sortable: true },
]

export default async function UsersPage() {
  const users = await fetchUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} users total</p>
      </div>

      <DataTable columns={columns} data={users} searchPlaceholder="Search users..." />
    </div>
  )
}
