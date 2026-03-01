'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { retryJob } from '@/app/actions/jobs'

interface Job {
  id: string
  episode_id: string
  source_url: string
  source: string  // "youtube" | "upload"
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

    // Determine poll interval based on whether all jobs are in terminal state
    // We check after initial load via a ref-less approach by reading state lazily in the interval
    const getInterval = () => {
      // We'll always use ACTIVE_POLL_MS when no filter is set and jobs may still be active.
      // When a specific terminal-only filter is active (ready/failed), use idle polling.
      if (statusFilter === 'ready' || statusFilter === 'failed') {
        return IDLE_POLL_MS
      }
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
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  async function handleRetry(jobId: string) {
    setRetryingIds((prev) => new Set(prev).add(jobId))
    const result = await retryJob(jobId)
    if (result.error) {
      alert(result.error)
    } else {
      // Immediately re-fetch to show updated status
      await fetchJobs(statusFilter)
      // Collapse the error row after retry
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

  // Check if all visible jobs are terminal (no active jobs) — for adaptive polling hint in UI
  const allTerminal =
    jobs.length > 0 && jobs.every((j) => TERMINAL_STATUSES.has(j.status))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ingestion Jobs</h1>
        <div className="flex items-center gap-3">
          {allTerminal && statusFilter === 'All' && (
            <span className="text-xs text-gray-400">
              All jobs complete — polling every 30s
            </span>
          )}
          <label htmlFor="status-filter" className="text-sm text-gray-600 font-medium">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setLoading(true)
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading jobs...</div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Episode</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Source</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Source URL</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Started At</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Completed At</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job, idx) => {
                  const isFailed = job.status === 'failed'
                  const isExpanded = expandedJobIds.has(job.id)
                  const isRetrying = retryingIds.has(job.id)

                  return (
                    <>
                      <tr
                        key={job.id}
                        className={
                          isFailed
                            ? 'border-l-4 border-l-red-400 bg-red-50 hover:bg-red-100 cursor-pointer'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }
                        onClick={isFailed ? () => toggleExpand(job.id) : undefined}
                        title={isFailed ? 'Click to expand error details' : undefined}
                      >
                        <td className="px-4 py-2 text-gray-700 font-mono text-xs whitespace-nowrap">
                          {job.episode_id ? job.episode_id.slice(-8) : '—'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            job.source === 'upload'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {job.source === 'upload' ? 'Upload' : 'YouTube'}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 text-gray-600 whitespace-nowrap"
                          title={job.source_url}
                        >
                          {truncateUrl(job.source_url)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={job.status} />
                            {isFailed && (
                              <span className="text-xs text-gray-400">
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                          {formatDateTime(job.started_at)}
                        </td>
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                          {formatDateTime(job.completed_at)}
                        </td>
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                          {formatDuration(job.started_at, job.completed_at)}
                        </td>
                      </tr>

                      {isFailed && isExpanded && (
                        <tr key={`${job.id}-error`} className="bg-red-50">
                          <td colSpan={7} className="px-6 py-4 border-l-4 border-l-red-400">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-red-700 mb-1">
                                  Error Details
                                </p>
                                <pre className="text-xs text-red-800 bg-red-100 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48">
                                  {job.error || 'No error message available.'}
                                </pre>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRetry(job.id)
                                }}
                                disabled={isRetrying}
                                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isRetrying ? 'Retrying...' : 'Retry'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Auto-refreshing every {statusFilter === 'ready' || statusFilter === 'failed' ? '30' : '5'} seconds.
      </p>
    </div>
  )
}
