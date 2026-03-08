'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Mascot from '@/components/Mascot'

const AVATARS = [
  { key: 'bear', emoji: '🐻' },
  { key: 'cat', emoji: '🐱' },
  { key: 'elephant', emoji: '🐘' },
  { key: 'rabbit', emoji: '🐰' },
  { key: 'star', emoji: '⭐' },
  { key: 'dolphin', emoji: '🐬' },
  { key: 'penguin', emoji: '🐧' },
  { key: 'butterfly', emoji: '🦋' },
]

const MATURITY_LEVELS = [
  { value: 'all', label: 'همه سنین' },
  { value: '6+', label: '۶+' },
  { value: '9+', label: '۹+' },
  { value: '12+', label: '۱۲+' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Step 2: PIN
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinLoading, setPinLoading] = useState(false)

  // Step 3: Child profile
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState<number>(5)
  const [childAvatar, setChildAvatar] = useState('bear')
  const [childMaturity, setChildMaturity] = useState('all')
  const [childError, setChildError] = useState<string | null>(null)
  const [childLoading, setChildLoading] = useState(false)

  async function handleSetPin() {
    setPinError(null)

    if (pin.length < 4 || pin.length > 6) {
      setPinError('رمز باید بین ۴ تا ۶ رقم باشد')
      return
    }
    if (pin !== confirmPin) {
      setPinError('رمزها یکسان نیستند')
      return
    }

    setPinLoading(true)
    try {
      const res = await authFetch('/me/pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) {
        setPinError('تنظیم رمز ناموفق بود')
        return
      }
      setStep(3)
    } catch {
      setPinError('اتصال به سرور برقرار نشد')
    } finally {
      setPinLoading(false)
    }
  }

  async function handleCreateChild() {
    setChildError(null)

    if (!childName.trim()) {
      setChildError('نام کودک الزامی است')
      return
    }
    if (childAge < 1 || childAge > 17) {
      setChildError('سن باید بین ۱ تا ۱۷ باشد')
      return
    }

    setChildLoading(true)
    try {
      const res = await authFetch('/me/children', {
        method: 'POST',
        body: JSON.stringify({
          name: childName.trim(),
          avatar: childAvatar,
          age: childAge,
          maturity_level: childMaturity,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        setChildError(text || 'ایجاد پروفایل ناموفق بود')
        return
      }
      setStep(4)
    } catch {
      setChildError('اتصال به سرور برقرار نشد')
    } finally {
      setChildLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 text-center" style={{ animation: 'kidtube-slide-up 0.4s ease' }}>
            <div className="mb-6">
              <Mascot state="waving" size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
              خوش آمدید!
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mb-8 leading-relaxed">
              به کیدتیوب خوش آمدید! بیایید حساب شما را تنظیم کنیم تا فرزندانتان از تماشای محتوای امن لذت ببرند.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-[var(--color-primary)] text-white rounded-2xl px-6 py-3 font-bold text-base border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 cursor-pointer"
            >
              شروع کنیم
            </button>
          </div>
        )}

        {/* Step 2: Set PIN */}
        {step === 2 && (
          <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8" style={{ animation: 'kidtube-slide-up 0.4s ease' }}>
            <div className="text-4xl text-center mb-4">🔒</div>
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2 text-center">
              تنظیم رمز والدین
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center leading-relaxed">
              یک رمز عددی برای محافظت از تنظیمات والدین انتخاب کنید.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="onb_pin" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  رمز جدید
                </label>
                <input
                  id="onb_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full clay-input px-4 py-2.5 text-sm text-center tracking-[0.5em]"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="onb_confirm_pin" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  تأیید رمز
                </label>
                <input
                  id="onb_confirm_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full clay-input px-4 py-2.5 text-sm text-center tracking-[0.5em]"
                  placeholder="••••"
                />
              </div>

              {pinError && (
                <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 text-center">
                  {pinError}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleSetPin}
                  disabled={pinLoading}
                  className="flex-1 bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {pinLoading ? 'در حال تنظیم...' : 'ادامه'}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] transition-all duration-200 cursor-pointer"
                >
                  رد شدن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Create first child profile */}
        {step === 3 && (
          <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8" style={{ animation: 'kidtube-slide-up 0.4s ease' }}>
            <div className="text-4xl text-center mb-4">👶</div>
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2 text-center">
              پروفایل فرزند
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center leading-relaxed">
              اولین پروفایل فرزند خود را بسازید.
            </p>

            <div className="flex flex-col gap-5">
              {/* Name */}
              <div>
                <label htmlFor="onb_child_name" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  نام کودک
                </label>
                <input
                  id="onb_child_name"
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full clay-input px-4 py-2.5 text-sm"
                  placeholder="نام کودک را وارد کنید"
                  autoFocus
                />
              </div>

              {/* Age */}
              <div>
                <label htmlFor="onb_child_age" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  سن
                </label>
                <input
                  id="onb_child_age"
                  type="number"
                  min={1}
                  max={17}
                  value={childAge}
                  onChange={(e) => setChildAge(parseInt(e.target.value) || 1)}
                  className="w-full clay-input px-4 py-2.5 text-sm"
                />
              </div>

              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  آواتار
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setChildAvatar(a.key)}
                      className={`flex items-center justify-center p-3 rounded-2xl border-[3px] transition-all duration-200 cursor-pointer ${
                        childAvatar === a.key
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-hover)] shadow-[var(--clay-shadow-hover)]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--clay-shadow)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      <span className="text-2xl" role="img" aria-label={a.key}>
                        {a.emoji}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Maturity Level */}
              <div>
                <label htmlFor="onb_maturity" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  سطح محتوا
                </label>
                <select
                  id="onb_maturity"
                  value={childMaturity}
                  onChange={(e) => setChildMaturity(e.target.value)}
                  className="w-full clay-input px-4 py-2.5 text-sm cursor-pointer"
                >
                  {MATURITY_LEVELS.map((ml) => (
                    <option key={ml.value} value={ml.value}>
                      {ml.label}
                    </option>
                  ))}
                </select>
              </div>

              {childError && (
                <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 text-center">
                  {childError}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleCreateChild}
                  disabled={childLoading}
                  className="flex-1 bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {childLoading ? 'در حال ایجاد...' : 'ایجاد پروفایل'}
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] transition-all duration-200 cursor-pointer"
                >
                  رد شدن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-8 text-center" style={{ animation: 'kidtube-slide-up 0.4s ease' }}>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-3">
              آماده‌اید!
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-8 leading-relaxed">
              حساب شما با موفقیت تنظیم شد. حالا می‌توانید از محتوای امن و سرگرم‌کننده لذت ببرید!
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[var(--color-primary)] text-white rounded-2xl px-6 py-3 font-bold text-base border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 cursor-pointer"
            >
              ورود به صفحه اصلی
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'bg-[var(--color-primary)] scale-125'
                  : i + 1 < step
                    ? 'bg-[var(--color-mint)]'
                    : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
