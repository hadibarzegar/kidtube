'use client'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/logo-horizontal.svg" alt="KidTube" width={160} height={40} priority className="h-10 w-auto" />
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text)] text-center mb-6">ثبت‌نام</h1>

        <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4" dir="rtl">
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
            placeholder="رمز عبور (حداقل ۸ کاراکتر)"
            dir="ltr"
            required
            minLength={8}
            className="clay-input px-4 py-3 text-sm"
          />
          <input
            name="confirm_password"
            type="password"
            placeholder="تکرار رمز عبور"
            dir="ltr"
            required
            className="clay-input px-4 py-3 text-sm"
          />

          {(passwordError || state?.error) && (
            <p className="text-[var(--color-error)] text-sm text-center">
              {passwordError ?? state?.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold rounded-2xl min-h-[48px] border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] transition-all duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-4">
          قبلاً حساب دارید؟{' '}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  )
}
