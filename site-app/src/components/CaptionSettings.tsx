'use client'

import React, { useState, useEffect } from 'react'

interface CaptionPrefs {
  fontSize: string
  bgOpacity: string
  textColor: string
}

const DEFAULTS: CaptionPrefs = {
  fontSize: '1em',
  bgOpacity: '0.75',
  textColor: '#fff',
}

const STORAGE_KEY = 'caption_prefs'

function loadPrefs(): CaptionPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

function savePrefs(prefs: CaptionPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  window.dispatchEvent(new Event('caption_prefs_changed'))
}

interface CaptionSettingsProps {
  onClose: () => void
}

const fontSizeOptions = [
  { label: 'کوچک', value: '0.8em' },
  { label: 'متوسط', value: '1em' },
  { label: 'بزرگ', value: '1.4em' },
] as const

const bgOpacityOptions = [
  { label: '۰٪', value: '0' },
  { label: '۵۰٪', value: '0.5' },
  { label: '۷۵٪', value: '0.75' },
  { label: '۱۰۰٪', value: '1' },
] as const

const textColorOptions = [
  { label: 'سفید', value: '#fff' },
  { label: 'زرد', value: '#ff0' },
] as const

export function CaptionSettings({ onClose }: CaptionSettingsProps) {
  const [prefs, setPrefs] = useState<CaptionPrefs>(DEFAULTS)

  useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  const update = (key: keyof CaptionPrefs, value: string) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePrefs(next)
  }

  return (
    <div
      dir="rtl"
      className="max-w-xs w-64 p-4 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[var(--clay-radius)] shadow-[var(--clay-shadow)] text-[var(--color-text)] text-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold">تنظیمات زیرنویس</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs hover:bg-black/20 transition-colors"
          aria-label="بستن"
        >
          ✕
        </button>
      </div>

      {/* Font size */}
      <fieldset className="mb-3">
        <legend className="font-semibold mb-1">اندازه متن</legend>
        <div className="flex gap-2">
          {fontSizeOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 text-center py-1 rounded-[var(--clay-radius-xs)] border-2 cursor-pointer transition-all ${
                prefs.fontSize === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="fontSize"
                value={opt.value}
                checked={prefs.fontSize === opt.value}
                onChange={() => update('fontSize', opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Background opacity */}
      <fieldset className="mb-3">
        <legend className="font-semibold mb-1">شفافیت پس‌زمینه</legend>
        <div className="flex gap-2">
          {bgOpacityOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 text-center py-1 rounded-[var(--clay-radius-xs)] border-2 cursor-pointer transition-all ${
                prefs.bgOpacity === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="bgOpacity"
                value={opt.value}
                checked={prefs.bgOpacity === opt.value}
                onChange={() => update('bgOpacity', opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Text color */}
      <fieldset>
        <legend className="font-semibold mb-1">رنگ متن</legend>
        <div className="flex gap-3 items-center">
          {textColorOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update('textColor', opt.value)}
              className={`w-8 h-8 rounded-full border-3 transition-all ${
                prefs.textColor === opt.value
                  ? 'border-[var(--color-primary)] scale-110'
                  : 'border-[var(--color-border)]'
              }`}
              style={{ backgroundColor: opt.value }}
              aria-label={opt.label}
              title={opt.label}
            />
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export { loadPrefs, STORAGE_KEY }
export type { CaptionPrefs }
