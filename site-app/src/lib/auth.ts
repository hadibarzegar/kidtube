import 'server-only'
import { jwtVerify } from 'jose'
import { getSiteSession } from './session'

export interface SiteUser {
  userId: string
  role: string
}

export async function getCurrentUser(): Promise<SiteUser | null> {
  const token = await getSiteSession()
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.user_id as string,
      role: (payload.role as string) ?? 'user',
    }
  } catch {
    return null // expired or invalid token — treat as guest
  }
}
