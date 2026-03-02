import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AgeGroupForm from './AgeGroupForm'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface AgeGroup {
  id: string
  name: string
  min_age: number
  max_age: number
}

async function fetchAgeGroup(id: string): Promise<AgeGroup | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch age group: ${res.status}`)
  return res.json()
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgeGroupPage({ params }: Props) {
  const { id } = await params
  const isNew = id === 'new'

  let ageGroup: AgeGroup | null = null
  if (!isNew) {
    ageGroup = await fetchAgeGroup(id)
    if (!ageGroup) notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/age-groups"
          className="text-sm text-slate-600 hover:underline"
        >
          &larr; Back to Age Groups
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? 'New Age Group' : `Edit Age Group: ${ageGroup?.name}`}
      </h1>

      <div className="bg-white rounded-md border border-gray-200 p-6 max-w-lg">
        <AgeGroupForm
          id={isNew ? null : id}
          defaultValues={{
            name: ageGroup?.name ?? '',
            min_age: ageGroup?.min_age ?? 0,
            max_age: ageGroup?.max_age ?? 0,
          }}
        />
      </div>
    </div>
  )
}
