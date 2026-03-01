'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  let res: Response
  try {
    res = await fetch(`${ADMIN_API_INTERNAL_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: 'Unable to reach the server. Please try again.' }
  }

  if (!res.ok) {
    return { error: 'Invalid credentials' }
  }

  const data = await res.json()
  await createSession(data.token)
  redirect('/admin/channels')
}

export async function logout() {
  await deleteSession()
  redirect('/admin/login')
}
