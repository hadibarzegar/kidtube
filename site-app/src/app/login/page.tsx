'use client'
import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { login } from '@/app/actions/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('return') ?? '/'
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/logo-horizontal.svg" alt="KidTube" width={160} height={40} priority className="h-10 w-auto" />
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text)] text-center mb-6">ورود به حساب</h1>

        <form action={formAction} className="flex flex-col gap-4" dir="rtl">
          <input
            name="email"
            type="email"
            placeholder="ایمیل"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="رمز عبور"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />
          <input type="hidden" name="return" value={returnUrl} />

          {state?.error && (
            <p className="text-[var(--color-error)] text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold rounded-2xl min-h-[48px] border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] transition-all duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-4">
          حساب کاربری ندارید؟{' '}
          <Link href="/register" className="text-[var(--color-primary)] hover:underline">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]" />}>
      <LoginForm />
    </Suspense>
  )
}
