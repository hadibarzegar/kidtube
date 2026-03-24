'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'
import type { AvatarConfig } from '@/lib/types'
import { randomAvatarConfig } from '@/lib/avatar-config'
import AvatarBuilder from './AvatarBuilder'

const MATURITY_LEVELS = [
  { value: 'all', label: 'همه سنین' },
  { value: '6+', label: '۶+' },
  { value: '9+', label: '۹+' },
  { value: '12+', label: '۱۲+' },
]

interface CreateChildModalProps {
  onCreated: () => void
  onClose: () => void
}

export default function CreateChildModal({ onCreated, onClose }: CreateChildModalProps) {
  const [name, setName] = useState('')
  const [age, setAge] = useState<number>(5)
  const [avatar, setAvatar] = useState<AvatarConfig>(() => randomAvatarConfig())
  const [maturityLevel, setMaturityLevel] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('نام کودک الزامی است')
      return
    }

    if (age < 1 || age > 17) {
      setError('سن باید بین ۱ تا ۱۷ باشد')
      return
    }

    setLoading(true)
    try {
      const res = await authFetch('/me/children', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          avatar,
          age,
          maturity_level: maturityLevel,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setError(text || 'ایجاد پروفایل ناموفق بود')
        return
      }

      onCreated()
    } catch {
      setError('اتصال به سرور برقرار نشد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-6 text-center">
          افزودن پروفایل کودک
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label htmlFor="child_name" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              نام کودک
            </label>
            <input
              id="child_name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full clay-input px-4 py-2.5 text-sm"
              placeholder="نام کودک را وارد کنید"
              autoFocus
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="child_age" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              سن
            </label>
            <input
              id="child_age"
              type="number"
              min={1}
              max={17}
              required
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 1)}
              className="w-full clay-input px-4 py-2.5 text-sm"
            />
          </div>

          {/* Avatar Builder */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              آواتار
            </label>
            <div className="bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-border)] p-3">
              <AvatarBuilder
                value={avatar}
                onChange={setAvatar}
                onDone={() => {}}
                compact
              />
            </div>
          </div>

          {/* Maturity Level */}
          <div>
            <label htmlFor="maturity_level" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              سطح محتوا
            </label>
            <select
              id="maturity_level"
              value={maturityLevel}
              onChange={(e) => setMaturityLevel(e.target.value)}
              className="w-full clay-input px-4 py-2.5 text-sm cursor-pointer"
            >
              {MATURITY_LEVELS.map((ml) => (
                <option key={ml.value} value={ml.value}>
                  {ml.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 text-center">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد پروفایل'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--color-surface)] text-[var(--color-text)] rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] transition-all duration-200 cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
