import 'server-only'
import { cookies } from 'next/headers'

export async function createSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/', // CRITICAL: must be '/' not '/admin' — cookie must be sent to /api/admin/*
  })
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_token')?.value ?? null
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
}
