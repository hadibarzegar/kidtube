'use server'
import { redirect } from 'next/navigation'
import { createSiteSession, deleteSiteSession } from '@/lib/session'

const SITE_API_INTERNAL_URL =
  process.env.SITE_API_INTERNAL_URL ?? 'http://localhost:8081'

export async function register(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'ایمیل و رمز عبور الزامی است' }
  if (password.length < 8) return { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }

  let res: Response
  try {
    res = await fetch(`${SITE_API_INTERNAL_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: 'اتصال به سرور برقرار نشد. دوباره تلاش کنید.' }
  }

  if (res.status === 409) return { error: 'این ایمیل قبلاً ثبت شده است' }
  if (!res.ok) return { error: 'ثبت‌نام ناموفق بود. دوباره تلاش کنید.' }

  // Auto-login after successful registration
  const loginRes = await fetch(`${SITE_API_INTERNAL_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (loginRes.ok) {
    const data = await loginRes.json()
    await createSiteSession(data.token)
  }

  redirect('/')
}

export async function login(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const returnUrl = (formData.get('return') as string) ?? '/'

  // Validate returnUrl — prevent open redirect
  const safeReturn = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/'

  if (!email || !password) return { error: 'ایمیل و رمز عبور الزامی است' }

  let res: Response
  try {
    res = await fetch(`${SITE_API_INTERNAL_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: 'اتصال به سرور برقرار نشد. دوباره تلاش کنید.' }
  }

  if (!res.ok) return { error: 'ایمیل یا رمز عبور اشتباه است' }

  const data = await res.json()
  await createSiteSession(data.token)
  redirect(safeReturn)
}

export async function logout() {
  await deleteSiteSession()
  redirect('/')
}
