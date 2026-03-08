'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/api'
import type { ChildProfile, ChannelRule, BedtimeRule, Episode } from '@/lib/types'
import { resolveImageUrl } from '@/lib/image'

interface ParentalControlsClientProps {
  childId: string
  child: ChildProfile
  initialRules: ChannelRule[]
}

export default function ParentalControlsClient({
  childId,
  child,
  initialRules,
}: ParentalControlsClientProps) {
  const [screenTimeLimit, setScreenTimeLimit] = useState(child.screen_time_limit_min)
  const [searchDisabled, setSearchDisabled] = useState(child.search_disabled)
  const [autoplayDisabled, setAutoplayDisabled] = useState(child.autoplay_disabled)
  const [watchHistoryPaused, setWatchHistoryPaused] = useState(child.watch_history_paused)
  const [searchHistoryPaused, setSearchHistoryPaused] = useState(child.search_history_paused)
  const [rules, setRules] = useState<ChannelRule[]>(initialRules)
  const [bedtimeEnabled, setBedtimeEnabled] = useState(false)
  const [bedtimeStart, setBedtimeStart] = useState('21:00')
  const [bedtimeEnd, setBedtimeEnd] = useState('07:00')
  const [blockedEpisodes, setBlockedEpisodes] = useState<Episode[]>([])
  const [hasPasscode, setHasPasscode] = useState(child.has_passcode)
  const [newPasscode, setNewPasscode] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load bedtime rule on mount
  useEffect(() => {
    async function loadBedtime() {
      try {
        const res = await authFetch(`/me/children/${childId}/bedtime`)
        if (res.ok) {
          const data: BedtimeRule = await res.json()
          setBedtimeEnabled(data.enabled)
          setBedtimeStart(data.start_time)
          setBedtimeEnd(data.end_time)
        }
      } catch {
        // Ignore — bedtime may not be set yet
      }
    }
    loadBedtime()
  }, [childId])

  // Load blocked episodes on mount
  useEffect(() => {
    async function loadBlockedEpisodes() {
      try {
        const res = await authFetch(`/me/children/${childId}/blocked-episodes`)
        if (res.ok) {
          const data: Episode[] = await res.json()
          setBlockedEpisodes(data)
        }
      } catch {
        // Ignore — blocked episodes may not exist yet
      }
    }
    loadBlockedEpisodes()
  }, [childId])

  async function unblockEpisode(episodeId: string) {
    try {
      const res = await authFetch(`/me/children/${childId}/blocked-episodes/${episodeId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setBlockedEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId))
      }
    } catch {
      setError('رفع مسدودیت ویدیو ناموفق بود')
    }
  }

  async function updateChild(updates: Partial<ChildProfile>) {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await authFetch(`/me/children/${childId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        setError('ذخیره تنظیمات ناموفق بود')
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('اتصال به سرور برقرار نشد')
    } finally {
      setSaving(false)
    }
  }

  function handleScreenTimeChange(value: number) {
    setScreenTimeLimit(value)
    updateChild({ screen_time_limit_min: value })
  }

  function handleSearchToggle() {
    const newValue = !searchDisabled
    setSearchDisabled(newValue)
    updateChild({ search_disabled: newValue })
  }

  function handleAutoplayToggle() {
    const newValue = !autoplayDisabled
    setAutoplayDisabled(newValue)
    updateChild({ autoplay_disabled: newValue })
  }

  function handleWatchHistoryPausedToggle() {
    const newValue = !watchHistoryPaused
    setWatchHistoryPaused(newValue)
    updateChild({ watch_history_paused: newValue })
  }

  function handleSearchHistoryPausedToggle() {
    const newValue = !searchHistoryPaused
    setSearchHistoryPaused(newValue)
    updateChild({ search_history_paused: newValue })
  }

  async function saveBedtime() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await authFetch(`/me/children/${childId}/bedtime`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: bedtimeEnabled,
          start_time: bedtimeStart,
          end_time: bedtimeEnd,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })
      if (!res.ok) {
        setError('ذخیره تنظیمات ساعت خواب ناموفق بود')
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('اتصال به سرور برقرار نشد')
    } finally {
      setSaving(false)
    }
  }

  async function setChildPasscode() {
    if (!/^\d{4}$/.test(newPasscode)) {
      setError('\u0631\u0645\u0632 \u0628\u0627\u06CC\u062F \u06F4 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await authFetch(`/me/children/${childId}/passcode`, {
        method: 'POST',
        body: JSON.stringify({ passcode: newPasscode }),
      })
      if (!res.ok) {
        setError('\u062A\u0646\u0638\u06CC\u0645 \u0631\u0645\u0632 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F')
        return
      }
      setHasPasscode(true)
      setNewPasscode('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u0633\u0631\u0648\u0631 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F')
    } finally {
      setSaving(false)
    }
  }

  async function removeChildPasscode() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await authFetch(`/me/children/${childId}/passcode`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        setError('\u062D\u0630\u0641 \u0631\u0645\u0632 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F')
        return
      }
      setHasPasscode(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u0633\u0631\u0648\u0631 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRule(ruleId: string) {
    try {
      const res = await authFetch(`/me/children/${childId}/channel-rules/${ruleId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId))
      }
    } catch {
      setError('حذف قانون ناموفق بود')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Screen time limit */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">محدودیت زمان تماشا</h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={180}
            step={15}
            value={screenTimeLimit}
            onChange={(e) => handleScreenTimeChange(parseInt(e.target.value))}
            className="flex-1 accent-[var(--color-primary)] cursor-pointer"
            disabled={saving}
          />
          <span className="text-sm font-medium text-[var(--color-text)] min-w-[80px] text-center">
            {screenTimeLimit === 0 ? 'نامحدود' : `${screenTimeLimit} دقیقه`}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          حداکثر زمان تماشای روزانه. ۰ به معنای نامحدود است.
        </p>
      </div>

      {/* Search toggle */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">غیرفعال کردن جستجو</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              کودک نمی‌تواند محتوا جستجو کند
            </p>
          </div>
          <button
            onClick={handleSearchToggle}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-all duration-200 cursor-pointer border-[2px] ${
              searchDisabled
                ? 'bg-[var(--color-primary)] border-[var(--color-primary-dark)]'
                : 'bg-[var(--color-border)] border-[var(--color-border)]'
            }`}
            role="switch"
            aria-checked={searchDisabled}
            aria-label="غیرفعال کردن جستجو"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                searchDisabled ? 'start-0.5' : 'start-[22px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Autoplay toggle */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">غیرفعال کردن پخش خودکار</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              ویدیوی بعدی به صورت خودکار پخش نمی‌شود
            </p>
          </div>
          <button
            onClick={handleAutoplayToggle}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-all duration-200 cursor-pointer border-[2px] ${
              autoplayDisabled
                ? 'bg-[var(--color-primary)] border-[var(--color-primary-dark)]'
                : 'bg-[var(--color-border)] border-[var(--color-border)]'
            }`}
            role="switch"
            aria-checked={autoplayDisabled}
            aria-label="غیرفعال کردن پخش خودکار"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                autoplayDisabled ? 'start-0.5' : 'start-[22px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Privacy - pause history */}
      <h2 className="text-base font-bold text-[var(--color-text)] mt-2">حریم خصوصی</h2>

      {/* Pause watch history toggle */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">توقف ذخیره تاریخچه تماشا</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              تاریخچه تماشای ویدیوها ذخیره نمی‌شود
            </p>
          </div>
          <button
            onClick={handleWatchHistoryPausedToggle}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-all duration-200 cursor-pointer border-[2px] ${
              watchHistoryPaused
                ? 'bg-[var(--color-primary)] border-[var(--color-primary-dark)]'
                : 'bg-[var(--color-border)] border-[var(--color-border)]'
            }`}
            role="switch"
            aria-checked={watchHistoryPaused}
            aria-label="توقف ذخیره تاریخچه تماشا"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                watchHistoryPaused ? 'start-0.5' : 'start-[22px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Pause search history toggle */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">توقف ذخیره تاریخچه جستجو</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              تاریخچه جستجوها ذخیره نمی‌شود
            </p>
          </div>
          <button
            onClick={handleSearchHistoryPausedToggle}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-all duration-200 cursor-pointer border-[2px] ${
              searchHistoryPaused
                ? 'bg-[var(--color-primary)] border-[var(--color-primary-dark)]'
                : 'bg-[var(--color-border)] border-[var(--color-border)]'
            }`}
            role="switch"
            aria-checked={searchHistoryPaused}
            aria-label="توقف ذخیره تاریخچه جستجو"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                searchHistoryPaused ? 'start-0.5' : 'start-[22px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Profile passcode */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">رمز پروفایل</h2>
        {hasPasscode ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-muted)]">رمز پروفایل فعال است</p>
            <button
              onClick={removeChildPasscode}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#FFF0F0] text-[var(--color-error)] font-medium text-sm border-[2px] border-[#FFD4D4] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              حذف رمز
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--color-text-muted)]">رمز پروفایل تنظیم نشده است</p>
            <div className="flex items-center gap-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 clay-input px-4 py-2.5 text-sm text-center tracking-[0.5em]"
                placeholder="••••"
              />
              <button
                onClick={setChildPasscode}
                disabled={saving || newPasscode.length !== 4}
                className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium text-sm border-[2px] border-[var(--color-primary-dark)] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                تنظیم رمز
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bedtime */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">ساعت خواب</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              در ساعت خواب، تماشای ویدیو مسدود می‌شود
            </p>
          </div>
          <button
            onClick={() => setBedtimeEnabled(!bedtimeEnabled)}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-all duration-200 cursor-pointer border-[2px] ${
              bedtimeEnabled
                ? 'bg-[var(--color-primary)] border-[var(--color-primary-dark)]'
                : 'bg-[var(--color-border)] border-[var(--color-border)]'
            }`}
            role="switch"
            aria-checked={bedtimeEnabled}
            aria-label="ساعت خواب"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                bedtimeEnabled ? 'start-0.5' : 'start-[22px]'
              }`}
            />
          </button>
        </div>
        {bedtimeEnabled && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">شروع</label>
                <input
                  type="time"
                  value={bedtimeStart}
                  onChange={(e) => setBedtimeStart(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 rounded-xl border-[2px] border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">پایان</label>
                <input
                  type="time"
                  value={bedtimeEnd}
                  onChange={(e) => setBedtimeEnd(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 rounded-xl border-[2px] border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            <button
              onClick={saveBedtime}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer border-[2px] border-[var(--color-primary-dark)]"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره ساعت خواب'}
            </button>
          </div>
        )}
      </div>

      {/* Channel rules */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">قوانین کانال‌ها</h2>
        {rules.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">هیچ قانونی تنظیم نشده است</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-bg)] border-[2px] border-[var(--color-border)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      rule.action === 'block'
                        ? 'bg-[#FFF0F0] text-[var(--color-error)]'
                        : 'bg-[#F0FFF4] text-green-600'
                    }`}
                  >
                    {rule.action === 'block' ? 'مسدود' : 'مجاز'}
                  </span>
                  <span className="text-sm text-[var(--color-text)]">
                    کانال: {rule.channel_id}
                  </span>
                </div>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="text-[var(--color-error)] hover:bg-[#FFF0F0] p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="حذف قانون"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked episodes */}
      <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">ویدیوهای مسدود شده</h2>
        {blockedEpisodes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">هیچ ویدیویی مسدود نشده</p>
        ) : (
          <div className="flex flex-col gap-3">
            {blockedEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-bg)] border-[2px] border-[var(--color-border)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {resolveImageUrl(ep.thumbnail) && (
                    <img
                      src={resolveImageUrl(ep.thumbnail)}
                      alt={ep.title}
                      className="w-16 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <span className="text-sm text-[var(--color-text)] truncate">
                    {ep.title}
                  </span>
                </div>
                <button
                  onClick={() => unblockEpisode(ep.id)}
                  className="text-[var(--color-error)] hover:bg-[#FFF0F0] p-1.5 rounded-full transition-colors cursor-pointer flex-shrink-0"
                  aria-label="رفع مسدودیت"
                  title="رفع مسدودیت"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 text-center">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-[var(--color-mint)] bg-[#F0FFF4] rounded-2xl border-[3px] border-[#B8E8C8] px-3 py-2 text-center">
          تنظیمات ذخیره شد
        </p>
      )}
    </div>
  )
}
