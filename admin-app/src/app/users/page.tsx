import { cookies } from 'next/headers'
import DataTable from '@/components/DataTable'

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

const columns = [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'created_at', label: 'Registered', sortable: true },
]

export default async function UsersPage() {
  const users = await fetchUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Users ({users.length})
        </h1>
      </div>

      <DataTable columns={columns} data={users} />
    </div>
  )
}
