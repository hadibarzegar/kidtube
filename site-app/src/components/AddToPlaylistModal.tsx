'use client'

import { authFetch } from '@/lib/api'
import type { Playlist } from '@/lib/types'
import { useEffect, useState } from 'react'

interface AddToPlaylistModalProps {
  episodeId: string
  onClose: () => void
}

export default function AddToPlaylistModal({ episodeId, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  async function fetchPlaylists() {
    setLoading(true)
    try {
      const res = await authFetch('/me/playlists')
      if (res.ok) {
        setPlaylists(await res.json())
      }
    } catch {}
    setLoading(false)
  }

  async function handleAdd(playlistId: string) {
    setAdding(playlistId)
    try {
      await authFetch(`/me/playlists/${playlistId}/episodes/${episodeId}`, { method: 'POST' })
      onClose()
    } catch {}
    setAdding(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await authFetch('/me/playlists', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (res.ok) {
        const created = await res.json()
        // Add episode to the newly created playlist
        await authFetch(`/me/playlists/${created.id}/episodes/${episodeId}`, { method: 'POST' })
        onClose()
      }
    } catch {}
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="clay-card bg-[var(--color-surface)] p-6 rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">افزودن به لیست پخش</h2>

        {loading ? (
          <div className="py-8 text-center text-[var(--color-text-faint)]">...</div>
        ) : (
          <div className="space-y-2">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAdd(pl.id)}
                disabled={adding === pl.id}
                className="w-full text-right clay-btn px-4 py-3 text-sm font-medium text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 rounded-lg"
              >
                <span>{pl.title}</span>
                <span className="text-[var(--color-text-faint)] mr-2">
                  ({(pl.episode_ids?.length ?? 0).toLocaleString('fa-IR')} ویدیو)
                </span>
              </button>
            ))}

            {playlists.length === 0 && !showCreate && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                لیست پخشی ندارید
              </p>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          {showCreate ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان لیست جدید..."
                className="clay-input flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="clay-btn px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] disabled:opacity-50"
              >
                {creating ? '...' : 'ایجاد'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full clay-btn px-4 py-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-bg)]"
            >
              + لیست جدید
            </button>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="clay-btn px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)]"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  )
}
