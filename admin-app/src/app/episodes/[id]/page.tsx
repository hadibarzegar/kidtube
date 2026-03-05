'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createEpisode, updateEpisode } from '@/app/actions/episodes'
import ImageUpload from '@/components/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, Youtube, Film } from 'lucide-react'

const ADMIN_API_INTERNAL_URL_CLIENT = '/api/admin'

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo', 'video/webm']
const ACCEPTED_EXTENSIONS = '.mp4,.mkv,.mov,.avi,.webm'
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

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
  thumbnail: string
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

  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [subtitleUrl, setSubtitleUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)

  const [sourceTab, setSourceTab] = useState<string>('youtube')
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
        const channelsRes = await fetch(`${ADMIN_API_INTERNAL_URL_CLIENT}/channels`, { credentials: 'include' })
        if (channelsRes.ok) setChannels(await channelsRes.json())

        if (!isNew) {
          const epRes = await fetch(`${ADMIN_API_INTERNAL_URL_CLIENT}/episodes/${id}`, { credentials: 'include' })
          if (epRes.status === 404) { router.push('/episodes'); return }
          if (epRes.ok) {
            const ep: Episode = await epRes.json()
            setEpisode(ep)
            setChannelId(ep.channel_id ?? '')
            setTitle(ep.title ?? '')
            setDescription(ep.description ?? '')
            setOrder(ep.order ?? 0)
            setThumbnailUrl(ep.thumbnail ?? '')
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
      const res = await fetch(`${ADMIN_API_INTERNAL_URL_CLIENT}/youtube-meta?url=${encodeURIComponent(sourceUrl)}`, { credentials: 'include' })
      if (res.ok) {
        const meta: YouTubeMeta = await res.json()
        if (meta.title) setTitle(meta.title)
        if (meta.description) setDescription(meta.description)
      }
    } catch {
      // silently fail
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
        if (file.size > MAX_FILE_SIZE) { setError('File exceeds 2GB limit'); return }
        setError(null)
        setUploadFile(file)
      }
    }
    input.click()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isNew && sourceTab === 'upload') {
      if (!uploadFile) { setError('Please select a video file'); return }
      if (!channelId) { setError('Channel is required'); return }
      if (!title) { setError('Title is required'); return }

      setIsUploading(true)
      setUploadProgress(0)
      setUploadStartTime(Date.now())
      setError(null)

      const fd = new FormData()
      fd.append('channel_id', channelId)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('order', String(order))
      fd.append('thumbnail', thumbnailUrl)
      fd.append('subtitle_url', subtitleUrl)
      fd.append('file', uploadFile)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/episodes/upload')
      xhr.withCredentials = true

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onload = () => {
        setIsUploading(false)
        if (xhr.status === 202) router.push('/episodes')
        else setError(`Upload failed: ${xhr.status} ${xhr.responseText}`)
      }
      xhr.onerror = () => { setIsUploading(false); setError('Network error during upload') }
      xhr.send(fd)
      return
    }

    const formData = new FormData()
    formData.set('channel_id', channelId)
    formData.set('title', title)
    formData.set('description', description)
    formData.set('order', String(order))
    formData.set('thumbnail', thumbnailUrl)
    formData.set('subtitle_url', subtitleUrl)
    if (isNew && sourceUrl) formData.set('source_url', sourceUrl)

    startTransition(async () => {
      const action = isNew ? createEpisode : updateEpisode.bind(null, id)
      const result = await action(undefined, formData)
      if (result?.error) setError(result.error)
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/episodes">Episodes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isNew ? 'New Episode' : episode?.title ?? 'Edit'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? 'New Episode' : `Edit Episode`}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel */}
              <div>
                <label htmlFor="channel_id" className="block text-sm font-medium mb-1.5">
                  Channel <span className="text-destructive">*</span>
                </label>
                <select
                  id="channel_id"
                  required
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Select a channel —</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              {/* Source tabs */}
              {isNew && (
                <Tabs value={sourceTab} onValueChange={setSourceTab}>
                  <TabsList>
                    <TabsTrigger value="youtube">
                      <Youtube className="w-3.5 h-3.5 mr-1.5" />
                      YouTube URL
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="youtube" className="mt-3">
                    <div>
                      <label htmlFor="source_url" className="block text-sm font-medium mb-1.5">
                        YouTube URL
                        <span className="ml-1 text-muted-foreground text-xs font-normal">(paste to auto-fill)</span>
                      </label>
                      <Input
                        id="source_url"
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        onBlur={handleYoutubeBlur}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      {fetchingMeta && <p className="mt-1 text-xs text-blue-600">Fetching metadata...</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault(); setIsDragOver(false)
                        const file = e.dataTransfer.files[0]
                        if (file) handleFileDrop(file)
                      }}
                      onClick={handleBrowseClick}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragOver ? 'border-primary bg-primary/5'
                          : uploadFile ? 'border-green-300 bg-green-50'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      }`}
                    >
                      {uploadFile ? (
                        <div>
                          <p className="text-sm font-medium text-green-700">{uploadFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatFileSize(uploadFile.size)}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setUploadFile(null) }}
                            className="mt-2 text-xs text-destructive hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Drag & drop a video file here</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">or click to browse</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">MP4, MKV, MOV, AVI, WebM — max 2GB</p>
                        </div>
                      )}
                    </div>

                    {isUploading && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{uploadProgress}%</span>
                          <span>{getEstimatedTimeRemaining()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1.5">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Episode title" />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1.5">Description</label>
                <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Episode description" />
              </div>

              {/* Order */}
              <div>
                <label htmlFor="order" className="block text-sm font-medium mb-1.5">Order</label>
                <Input id="order" type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} placeholder="0" className="max-w-[120px]" />
              </div>

              {/* Subtitle URL */}
              <div>
                <label htmlFor="subtitle_url" className="block text-sm font-medium mb-1.5">Subtitle URL</label>
                <Input id="subtitle_url" type="url" value={subtitleUrl} onChange={(e) => setSubtitleUrl(e.target.value)} placeholder="https://example.com/subtitles.vtt" />
              </div>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                {thumbnailUrl ? (
                  <div className="mb-3">
                    <img
                      src={thumbnailUrl.startsWith('/images/') ? `/api/admin${thumbnailUrl}` : thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full aspect-video rounded-md border object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center mb-3">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} label="" />
              </CardContent>
            </Card>

            {!isNew && episode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono text-xs">{episode.id.slice(0, 12)}...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 pt-4 border-t">
          <Button type="submit" disabled={isPending || isUploading}>
            {isUploading ? 'Uploading...' : isPending ? 'Saving...' : isNew ? 'Create Episode' : 'Update Episode'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/episodes">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
