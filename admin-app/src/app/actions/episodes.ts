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

export async function createEpisode(prevState: unknown, formData: FormData) {
  const channelId = (formData.get('channel_id') as string)?.trim()
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const order = Number(formData.get('order') ?? 0)
  const subtitleUrl = (formData.get('subtitle_url') as string)?.trim()
  const sourceUrl = (formData.get('source_url') as string)?.trim()

  if (!channelId) return { error: 'Channel is required' }
  if (!title) return { error: 'Title is required' }

  const auth = await getAuthHeader()
  const body: Record<string, unknown> = {
    channel_id: channelId,
    title,
    description: description || '',
    order: isNaN(order) ? 0 : order,
    subtitle_url: subtitleUrl || '',
  }
  if (sourceUrl) {
    body.source_url = sourceUrl
  }

  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/episodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(body),
  })

  // 201 = created, 202 = accepted (async job started)
  if (!res.ok && res.status !== 201 && res.status !== 202) {
    const bodyText = await res.text()
    return { error: `Failed to create episode: ${bodyText}` }
  }

  revalidatePath('/episodes')
  redirect('/episodes')
}

export async function updateEpisode(id: string, prevState: unknown, formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const order = Number(formData.get('order') ?? 0)
  const subtitleUrl = (formData.get('subtitle_url') as string)?.trim()

  if (!title) return { error: 'Title is required' }

  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/episodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({
      title,
      description: description || '',
      order: isNaN(order) ? 0 : order,
      subtitle_url: subtitleUrl || '',
    }),
  })

  if (!res.ok) {
    const bodyText = await res.text()
    return { error: `Failed to update episode: ${bodyText}` }
  }

  revalidatePath('/episodes')
  redirect('/episodes')
}

export async function deleteEpisode(id: string) {
  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/episodes/${id}`, {
    method: 'DELETE',
    headers: { ...auth },
  })

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete episode: ${res.status}`)
  }

  revalidatePath('/episodes')
}
