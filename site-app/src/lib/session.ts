import 'server-only'
import { cookies } from 'next/headers'

export async function createSiteSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('site_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getSiteSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('site_token')?.value ?? null
}

export async function deleteSiteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('site_token')
}
