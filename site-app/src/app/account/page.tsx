import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser } from '@/lib/types'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata = {
  title: 'حساب کاربری — KidTube',
}

export default async function AccountPage() {
  // proxy.ts redirects guests to /login so this page always has a valid token
  const token = await getSiteSession()
  let user: SiteUser | null = null

  if (token) {
    const res = await apiServerAuthFetch('/me', token)
    if (res.ok) {
      user = await res.json()
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">حساب کاربری</h1>

        {/* User info card */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6 mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-1">ایمیل</h2>
          <p className="text-[var(--color-text)] font-medium">{user?.email ?? '—'}</p>
        </div>

        {/* Change password card */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">تغییر رمز عبور</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
