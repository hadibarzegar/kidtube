'use client'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm_password') as HTMLInputElement).value

    if (password !== confirm) {
      e.preventDefault()
      setPasswordError('رمز عبور و تکرار آن یکسان نیستند')
      return
    }
    setPasswordError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-blue-500">کیدتیوب</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 text-center mb-6">ثبت‌نام</h1>

        <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4" dir="rtl">
          <input
            name="email"
            type="email"
            placeholder="ایمیل"
            dir="ltr"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="password"
            type="password"
            placeholder="رمز عبور (حداقل ۸ کاراکتر)"
            dir="ltr"
            required
            minLength={8}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="confirm_password"
            type="password"
            placeholder="تکرار رمز عبور"
            dir="ltr"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {(passwordError || state?.error) && (
            <p className="text-red-500 text-sm text-center">
              {passwordError ?? state?.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg min-h-[48px] transition-colors disabled:opacity-60"
          >
            {isPending ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          قبلاً حساب دارید؟{' '}
          <Link href="/login" className="text-blue-500 hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  )
}
