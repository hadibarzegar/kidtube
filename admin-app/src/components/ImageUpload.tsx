'use client'

import { useState } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

function resolvePreviewUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('/images/')) return `/api/admin${url}`
  return url
}

export default function ImageUpload({ value, onChange, label = 'Thumbnail' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setError('Unsupported image type. Use JPEG, PNG, WebP, or GIF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image exceeds 10MB limit.')
      return
    }

    setUploading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/admin/images/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload failed' }))
        setError(body.error || 'Upload failed')
        return
      }
      const data = await res.json()
      onChange(data.url)
    } catch {
      setError('Network error during upload')
    } finally {
      setUploading(false)
    }
  }

  const previewUrl = resolvePreviewUrl(value)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {previewUrl && (
        <div className="mb-2 relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-40 aspect-video rounded-md border border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            &times;
          </button>
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={uploading}
        className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer disabled:opacity-50"
      />
      {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
