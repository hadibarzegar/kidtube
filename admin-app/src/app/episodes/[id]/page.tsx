'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createEpisode, updateEpisode } from '@/app/actions/episodes'

const ADMIN_API_INTERNAL_URL_CLIENT = '/api/admin'

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo', 'video/webm']
const ACCEPTED_EXTENSIONS = '.mp4,.mkv,.mov,.avi,.webm'
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB

interface Channel {
  id: string
  name: string
}

interface Episode {
  id: string
  channel_id: string
  title: string
  description: string
  order: number
  subtitle_url: string
}

interface YouTubeMeta {
  title: string
  description: string
  thumbnail: string
  duration: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export default function EpisodePage() {
  const params = useParams()
  const id = params.id as string
  const isNew = id === 'new'
  const router = useRouter()

  const [channels, setChannels] = useState<Channel[]>([])
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(0)
  const [subtitleUrl, setSubtitleUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)

  // Tab and upload state
  const [sourceTab, setSourceTab] = useState<'youtube' | 'upload'>('youtube')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStartTime, setUploadStartTime] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const [isPending, startTransition] = useTransition()

  function getEstimatedTimeRemaining(): string {
    if (uploadProgress <= 0 || !uploadStartTime || !uploadFile) return ''
    const elapsed = Date.now() - uploadStartTime
    const bytesPerMs = (uploadProgress / 100 * uploadFile.size) / elapsed
    if (bytesPerMs <= 0) return ''
    const remainingBytes = uploadFile.size * (1 - uploadProgress / 100)
    const remainingMs = remainingBytes / bytesPerMs
    const remainingSec = Math.round(remainingMs / 1000)
    if (remainingSec < 60) return `~${remainingSec}s remaining`
    const mins = Math.floor(remainingSec / 60)
    const secs = remainingSec % 60
    return `~${mins}m ${secs}s remaining`
  }

  useEffect(() => {
    async function loadData() {
      try {
        const channelsRes = await fetch(`${ADMIN_API_INTERNAL_URL_CLIENT}/channels`, {
          credentials: 'include',
        })
        if (channelsRes.ok) {
          setChannels(await channelsRes.json())
        }

        if (!isNew) {
          const epRes = await fetch(`${ADMIN_API_INTERNAL_URL_CLIENT}/episodes/${id}`, {
            credentials: 'include',
          })
          if (epRes.status === 404) {
            router.push('/episodes')
            return
          }
          if (epRes.ok) {
            const ep: Episode = await epRes.json()
            setEpisode(ep)
            setChannelId(ep.channel_id ?? '')
            setTitle(ep.title ?? '')
            setDescription(ep.description ?? '')
            setOrder(ep.order ?? 0)
            setSubtitleUrl(ep.subtitle_url ?? '')
          }
        }
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isNew, router])

  async function handleYoutubeBlur() {
    if (!sourceUrl.trim()) return

    setFetchingMeta(true)
    try {
      const res = await fetch(
        `${ADMIN_API_INTERNAL_URL_CLIENT}/youtube-meta?url=${encodeURIComponent(sourceUrl)}`,
        { credentials: 'include' }
      )
      if (res.ok) {
        const meta: YouTubeMeta = await res.json()
        if (meta.title && !title) setTitle(meta.title)
        else if (meta.title) setTitle(meta.title)
        if (meta.description && !description) setDescription(meta.description)
        else if (meta.description) setDescription(meta.description)
      }
    } catch {
      // silently fail — admin can fill manually
    } finally {
      setFetchingMeta(false)
    }
  }

  function handleFileDrop(file: File) {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError('Unsupported file type. Accepted: MP4, MKV, MOV, AVI, WebM')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 2GB limit')
      return
    }
    setError(null)
    setUploadFile(file)
  }

  function handleBrowseClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_EXTENSIONS
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          setError('File exceeds 2GB limit')
          return
        }
        setError(null)
        setUploadFile(file)
      }
    }
    input.click()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isNew && sourceTab === 'upload') {
      // Upload path — use XHR for progress
      if (!uploadFile) {
        setError('Please select a video file')
        return
      }
      if (!channelId) {
        setError('Channel is required')
        return
      }
      if (!title) {
        setError('Title is required')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)
      setUploadStartTime(Date.now())
      setError(null)

      const fd = new FormData()
      // Text fields FIRST — Go reads multipart in order
      fd.append('channel_id', channelId)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('order', String(order))
      fd.append('subtitle_url', subtitleUrl)
      fd.append('file', uploadFile) // file LAST

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/episodes/upload')
      xhr.withCredentials = true // REQUIRED: send admin_token cookie
      // Do NOT set Content-Type — browser sets it with boundary automatically

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        setIsUploading(false)
        if (xhr.status === 202) {
          router.push('/episodes')
        } else {
          setError(`Upload failed: ${xhr.status} ${xhr.responseText}`)
        }
      }

      xhr.onerror = () => {
        setIsUploading(false)
        setError('Network error during upload')
      }

      xhr.send(fd)
      return
    }

    // YouTube path — existing logic (unchanged)
    const formData = new FormData()
    formData.set('channel_id', channelId)
    formData.set('title', title)
    formData.set('description', description)
    formData.set('order', String(order))
    formData.set('subtitle_url', subtitleUrl)
    if (isNew && sourceUrl) {
      formData.set('source_url', sourceUrl)
    }

    startTransition(async () => {
      const action = isNew ? createEpisode : updateEpisode.bind(null, id)
      const result = await action(undefined, formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/episodes"
          className="text-sm text-slate-600 hover:underline"
        >
          &larr; Back to Episodes
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? 'New Episode' : `Edit Episode: ${episode?.title ?? id}`}
      </h1>

      <div className="bg-white rounded-md border border-gray-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel */}
          <div>
            <label htmlFor="channel_id" className="block text-sm font-medium text-gray-700 mb-1">
              Channel <span className="text-red-500">*</span>
            </label>
            <select
              id="channel_id"
              name="channel_id"
              required
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              <option value="">— Select a channel —</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source selection — create only */}
          {isNew && (
            <div>
              {/* Tab buttons */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setSourceTab('youtube')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    sourceTab === 'youtube'
                      ? 'border-slate-800 text-slate-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  YouTube URL
                </button>
                <button
                  type="button"
                  onClick={() => setSourceTab('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    sourceTab === 'upload'
                      ? 'border-slate-800 text-slate-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload File
                </button>
              </div>

              {/* YouTube tab content */}
              {sourceTab === 'youtube' && (
                <div>
                  <label htmlFor="source_url" className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube URL
                    <span className="ml-1 text-gray-400 text-xs font-normal">(paste to auto-fill title and description)</span>
                  </label>
                  <input
                    id="source_url"
                    name="source_url"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    onBlur={handleYoutubeBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {fetchingMeta && (
                    <p className="mt-1 text-xs text-blue-600">Fetching metadata...</p>
                  )}
                </div>
              )}

              {/* Upload tab content — drag-and-drop zone */}
              {sourceTab === 'upload' && (
                <div>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileDrop(file)
                    }}
                    onClick={handleBrowseClick}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-slate-400 bg-slate-50'
                        : uploadFile
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {uploadFile ? (
                      <div>
                        <p className="text-sm font-medium text-green-700">{uploadFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(uploadFile.size)}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUploadFile(null) }}
                          className="mt-2 text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">Drag &amp; drop a video file here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">MP4, MKV, MOV, AVI, WebM &mdash; max 2GB</p>
                      </div>
                    )}
                  </div>

                  {/* Progress bar — shown during upload */}
                  {isUploading && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{uploadProgress}%</span>
                        <span>{getEstimatedTimeRemaining()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-slate-700 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Episode title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Episode description"
            />
          </div>

          {/* Order */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <input
              id="order"
              name="order"
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="0"
            />
          </div>

          {/* Subtitle URL */}
          <div>
            <label htmlFor="subtitle_url" className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle URL
            </label>
            <input
              id="subtitle_url"
              name="subtitle_url"
              type="url"
              value={subtitleUrl}
              onChange={(e) => setSubtitleUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="https://example.com/subtitles.vtt"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || isUploading}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isUploading ? 'Uploading...' : isPending ? 'Saving...' : isNew ? 'Create Episode' : 'Update Episode'}
          </button>
        </form>
      </div>
    </div>
  )
}
