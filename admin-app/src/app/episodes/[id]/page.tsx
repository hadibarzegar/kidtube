'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createEpisode, updateEpisode } from '@/app/actions/episodes'

const ADMIN_API_INTERNAL_URL_CLIENT = '/api/admin'

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

  const [isPending, startTransition] = useTransition()

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
            router.push('/admin/episodes')
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
          href="/admin/episodes"
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

          {/* YouTube URL — create only */}
          {isNew && (
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
            disabled={isPending}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving...' : isNew ? 'Create Episode' : 'Update Episode'}
          </button>
        </form>
      </div>
    </div>
  )
}
