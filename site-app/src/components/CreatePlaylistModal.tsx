'use client'

import { authFetch } from '@/lib/api'
import { useState } from 'react'

interface CreatePlaylistModalProps {
  onCreated: () => void
  onClose: () => void
}

export default function CreatePlaylistModal({ onCreated, onClose }: CreatePlaylistModalProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/me/playlists', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() }),
      })
      if (res.ok) {
        onCreated()
        onClose()
      } else {
        setError('خطا در ایجاد لیست پخش')
      }
    } catch {
      setError('خطا در ایجاد لیست پخش')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="clay-card bg-[var(--color-surface)] p-6 rounded-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">ایجاد لیست جدید</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
            عنوان لیست
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان لیست پخش..."
            className="clay-input w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            autoFocus
          />
          {error && <p className="text-xs text-[var(--color-danger)] mt-2">{error}</p>}
          <div className="flex gap-3 mt-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="clay-btn px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="clay-btn px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] disabled:opacity-50"
            >
              {loading ? '...' : 'ایجاد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
