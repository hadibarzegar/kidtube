'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function createAgeGroup(prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const minAge = Number(formData.get('min_age'))
  const maxAge = Number(formData.get('max_age'))

  if (!name) return { error: 'Name is required' }
  if (isNaN(minAge) || minAge < 0) return { error: 'Min age must be a non-negative number' }
  if (isNaN(maxAge)) return { error: 'Max age is required' }
  if (maxAge <= minAge) return { error: 'Max age must be greater than min age' }

  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ name, min_age: minAge, max_age: maxAge }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { error: `Failed to create age group: ${body}` }
  }

  revalidatePath('/age-groups')
  redirect('/age-groups')
}

export async function updateAgeGroup(id: string, prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const minAge = Number(formData.get('min_age'))
  const maxAge = Number(formData.get('max_age'))

  if (!name) return { error: 'Name is required' }
  if (isNaN(minAge) || minAge < 0) return { error: 'Min age must be a non-negative number' }
  if (isNaN(maxAge)) return { error: 'Max age is required' }
  if (maxAge <= minAge) return { error: 'Max age must be greater than min age' }

  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ name, min_age: minAge, max_age: maxAge }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { error: `Failed to update age group: ${body}` }
  }

  revalidatePath('/age-groups')
  redirect('/age-groups')
}

export async function deleteAgeGroup(id: string) {
  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/age-groups/${id}`, {
    method: 'DELETE',
    headers: { ...auth },
  })

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete age group: ${res.status}`)
  }

  revalidatePath('/age-groups')
}
