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
        <label htmlFor="current_password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          رمز عبور فعلی
        </label>
        <input
          id="current_password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full clay-input px-4 py-2.5 text-sm"
          placeholder="رمز عبور فعلی"
        />
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          رمز عبور جدید
        </label>
        <input
          id="new_password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full clay-input px-4 py-2.5 text-sm"
          placeholder="حداقل ۸ کاراکتر"
        />
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          تکرار رمز عبور جدید
        </label>
        <input
          id="confirm_password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full clay-input px-4 py-2.5 text-sm"
          placeholder="تکرار رمز عبور جدید"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-[var(--color-mint)] bg-[#F0FFF4] rounded-2xl border-[3px] border-[#B8E8C8] px-3 py-2">
          رمز عبور تغییر کرد
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? 'در حال ذخیره...' : 'ذخیره'}
      </button>
    </form>
  )
}
