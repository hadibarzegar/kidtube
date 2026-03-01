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

export async function createCategory(prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { error: `Failed to create category: ${body}` }
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function updateCategory(id: string, prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { error: `Failed to update category: ${body}` }
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function deleteCategory(id: string) {
  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: { ...auth },
  })

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete category: ${res.status}`)
  }

  revalidatePath('/admin/categories')
}
