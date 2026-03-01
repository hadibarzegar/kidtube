'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }

    setLoading(true)
    try {
      const res = await authFetch('/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (res.status === 401) {
        setError('رمز عبور فعلی اشتباه است')
        return
      }
      if (res.status === 400) {
        const text = await res.text()
        setError(text || 'درخواست نامعتبر است')
        return
      }
      if (!res.ok) {
        setError('تغییر رمز عبور ناموفق بود. دوباره تلاش کنید.')
        return
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('اتصال به سرور برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
          رمز عبور فعلی
        </label>
        <input
          id="current_password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="رمز عبور فعلی"
        />
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
          رمز عبور جدید
        </label>
        <input
          id="new_password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="حداقل ۸ کاراکتر"
        />
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
          تکرار رمز عبور جدید
        </label>
        <input
          id="confirm_password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="تکرار رمز عبور جدید"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          رمز عبور تغییر کرد
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white rounded-xl px-6 py-2.5 font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? 'در حال ذخیره...' : 'ذخیره'}
      </button>
    </form>
  )
}
