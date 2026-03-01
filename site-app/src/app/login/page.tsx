'use client'
import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('return') ?? '/'
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-blue-500">کیدتیوب</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 text-center mb-6">ورود به حساب</h1>

        <form action={formAction} className="flex flex-col gap-4" dir="rtl">
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
            placeholder="رمز عبور"
            dir="ltr"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input type="hidden" name="return" value={returnUrl} />

          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg min-h-[48px] transition-colors disabled:opacity-60"
          >
            {isPending ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          حساب کاربری ندارید؟{' '}
          <Link href="/register" className="text-blue-500 hover:underline">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50" />}>
      <LoginForm />
    </Suspense>
  )
}
