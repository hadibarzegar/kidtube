'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { retryJob } from '@/app/actions/jobs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, ChevronDown, ChevronUp, Inbox } from 'lucide-react'

interface Job {
  id: string
  episode_id: string
  source_url: string
  source: string
  status: string
  error: string
  started_at: string
  completed_at: string
  created_at: string
}

const STATUS_OPTIONS = ['All', 'pending', 'downloading', 'transcoding', 'ready', 'failed']
const TERMINAL_STATUSES = new Set(['ready', 'failed'])
const ACTIVE_POLL_MS = 5000
const IDLE_POLL_MS = 30000

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  downloading: 'bg-blue-100 text-blue-800',
  transcoding: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

function formatDuration(startedAt: string, completedAt: string): string {
  if (!startedAt || !completedAt) return '—'
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  if (isNaN(start) || isNaN(end)) return '—'
  const seconds = Math.round((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function truncateUrl(url: string, maxLen = 40): string {
  if (!url) return '—'
  return url.length > maxLen ? url.slice(0, maxLen) + '…' : url
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return '—'
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set())
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async (filter: string) => {
    const path = filter === 'All' ? '/jobs' : `/jobs?status=${filter}`
    const res = await apiFetch(path)
    if (!res.ok) {
      setError('Failed to load jobs.')
      return
    }
    const data: Job[] = await res.json()
    setJobs(data ?? [])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchJobs(statusFilter)

    const getInterval = () => {
      if (statusFilter === 'ready' || statusFilter === 'failed') return IDLE_POLL_MS
      return ACTIVE_POLL_MS
    }

    const interval = setInterval(() => {
      fetchJobs(statusFilter)
    }, getInterval())

    return () => clearInterval(interval)
  }, [statusFilter, fetchJobs])

  function toggleExpand(jobId: string) {
    setExpandedJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  async function handleRetry(jobId: string) {
    setRetryingIds((prev) => new Set(prev).add(jobId))
    const result = await retryJob(jobId)
    if (result.error) {
      alert(result.error)
    } else {
      await fetchJobs(statusFilter)
      setExpandedJobIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
    setRetryingIds((prev) => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }

  const allTerminal =
    jobs.length > 0 && jobs.every((j) => TERMINAL_STATUSES.has(j.status))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ingestion Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {allTerminal && statusFilter === 'All'
              ? 'All jobs complete — polling every 30s'
              : `Auto-refreshing every ${statusFilter === 'ready' || statusFilter === 'failed' ? '30' : '5'}s`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setLoading(true) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'All' ? 'All Statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mb-2" />
          <span className="text-sm">Loading jobs...</span>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Episode</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Source URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Inbox className="h-8 w-8 mb-2" />
                      <span className="text-sm">No jobs found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const isFailed = job.status === 'failed'
                  const isExpanded = expandedJobIds.has(job.id)
                  const isRetrying = retryingIds.has(job.id)

                  return (
                    <>
                      <TableRow
                        key={job.id}
                        className={
                          isFailed
                            ? 'border-l-4 border-l-destructive bg-destructive/5 hover:bg-destructive/10 cursor-pointer'
                            : ''
                        }
                        onClick={isFailed ? () => toggleExpand(job.id) : undefined}
                      >
                        <TableCell className="font-mono text-xs">
                          {job.episode_id ? job.episode_id.slice(-8) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            job.source === 'upload'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }>
                            {job.source === 'upload' ? 'Upload' : 'YouTube'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground" title={job.source_url}>
                          {truncateUrl(job.source_url)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className={statusColors[job.status] ?? 'bg-gray-100 text-gray-800'}>
                              {job.status}
                            </Badge>
                            {isFailed && (
                              isExpanded
                                ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(job.started_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(job.completed_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDuration(job.started_at, job.completed_at)}</TableCell>
                      </TableRow>

                      {isFailed && isExpanded && (
                        <TableRow key={`${job.id}-error`} className="bg-destructive/5">
                          <TableCell colSpan={7} className="border-l-4 border-l-destructive">
                            <div className="space-y-3 py-1">
                              <div>
                                <p className="text-xs font-semibold text-destructive mb-1">Error Details</p>
                                <pre className="text-xs text-destructive bg-destructive/10 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48">
                                  {job.error || 'No error message available.'}
                                </pre>
                              </div>
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleRetry(job.id) }}
                                disabled={isRetrying}
                              >
                                <RefreshCw className={`mr-1.5 h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                                {isRetrying ? 'Retrying...' : 'Retry'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
