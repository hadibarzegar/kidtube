import { getSiteSession } from '@/lib/session'
import { apiServerAuthFetch } from '@/lib/api'
import type { SiteUser } from '@/lib/types'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata = {
  title: 'حساب کاربری — کیدتیوب',
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">حساب کاربری</h1>

        {/* User info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">ایمیل</h2>
          <p className="text-gray-900 font-medium">{user?.email ?? '—'}</p>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">تغییر رمز عبور</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
