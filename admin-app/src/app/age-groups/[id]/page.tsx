import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import AgeGroupForm from './AgeGroupForm'
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
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/age-groups">Age Groups</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isNew ? 'New Age Group' : ageGroup?.name ?? 'Edit'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? 'New Age Group' : 'Edit Age Group'}
      </h1>

      <AgeGroupForm
        id={isNew ? null : id}
        defaultValues={{
          name: ageGroup?.name ?? '',
          min_age: ageGroup?.min_age ?? 0,
          max_age: ageGroup?.max_age ?? 0,
        }}
      />
    </div>
  )
}
