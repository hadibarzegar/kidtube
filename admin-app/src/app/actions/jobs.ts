'use server'

import { cookies } from 'next/headers'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function retryJob(jobId: string): Promise<{ error?: string }> {
  const auth = await getAuthHeader()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/jobs/${jobId}/retry`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth },
  })

  if (!res.ok) {
    const body = await res.text()
    return { error: `Failed to retry job: ${body}` }
  }

  return {}
}
