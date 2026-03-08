'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api'

interface ReportButtonProps {
  episodeId: string
}

const REASONS = [
  { value: 'inappropriate', label: 'محتوای نامناسب' },
  { value: 'violent', label: 'خشونت' },
  { value: 'other', label: 'سایر' },
]

export default function ReportButton({ episodeId }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason || loading) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await authFetch(`/episodes/${episodeId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      })

      if (res.status === 401) {
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
        return
      }

      if (res.status === 409) {
        setMessage('قبلاً گزارش داده‌اید')
        return
      }

      if (res.ok) {
        setMessage('گزارش ثبت شد')
        setTimeout(() => {
          setShowModal(false)
          setMessage(null)
          setReason('')
          setDetails('')
        }, 1500)
      }
    } catch {
      setMessage('اتصال به سرور برقرار نشد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        aria-label="گزارش محتوا"
        className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 text-[var(--color-text-muted)] cursor-pointer active:scale-95 hover:bg-[var(--color-border)]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span>گزارش</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
              setMessage(null)
            }
          }}
        >
          <div className="bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 text-center">
              گزارش محتوا
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Reason selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  دلیل گزارش
                </label>
                <div className="flex flex-col gap-2">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border-[3px] cursor-pointer transition-all duration-200 ${
                        reason === r.value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-hover)]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm text-[var(--color-text)]">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional details */}
              <div>
                <label htmlFor="report_details" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  id="report_details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="w-full clay-input px-4 py-2.5 text-sm resize-none"
                  placeholder="توضیحات اضافی..."
                />
              </div>

              {message && (
                <p className={`text-sm rounded-2xl border-[3px] px-3 py-2 text-center ${
                  message === 'گزارش ثبت شد'
                    ? 'text-[var(--color-mint)] bg-[#F0FFF4] border-[#C6F6D5]'
                    : 'text-[var(--color-error)] bg-[#FFF0F0] border-[#FFD4D4]'
                }`}>
                  {message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !reason}
                  className="flex-1 bg-[var(--color-primary)] text-white rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-primary-dark)] shadow-[var(--clay-shadow)] hover:bg-[var(--color-primary-dark)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? 'در حال ارسال...' : 'ارسال گزارش'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setMessage(null)
                  }}
                  className="flex-1 bg-[var(--color-surface)] text-[var(--color-text)] rounded-2xl px-6 py-2.5 font-medium text-sm border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] transition-all duration-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
