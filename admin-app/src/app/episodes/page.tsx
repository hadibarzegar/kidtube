import { cookies } from 'next/headers'
import Link from 'next/link'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { deleteEpisode } from '@/app/actions/episodes'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Episode {
  id: string
  channel_id: string
  title: string
  description: string
  order: number
  status: string
  created_at: string
}

interface Job {
  id: string
  episode_id: string
  status: string
}

interface Channel {
  id: string
  name: string
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchEpisodes(): Promise<Episode[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/episodes`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchJobs(): Promise<Job[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/jobs`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchChannels(): Promise<Channel[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/channels`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'channelName', label: 'Channel', sortable: true },
  { key: 'order', label: 'Order', sortable: true },
  { key: 'statusBadge', label: 'Status', sortable: false },
  { key: 'created_at', label: 'Created At', sortable: true },
]

export default async function EpisodesPage() {
  const [episodes, jobs, channels] = await Promise.all([
    fetchEpisodes(),
    fetchJobs(),
    fetchChannels(),
  ])

  // Build a map from episode_id to the latest job status
  const jobStatusMap: Record<string, string> = {}
  for (const job of jobs) {
    if (job.episode_id) {
      jobStatusMap[job.episode_id] = job.status
    }
  }

  const channelMap = Object.fromEntries(channels.map((c) => [c.id, c.name]))

  const tableData = episodes.map((ep) => {
    const jobStatus = jobStatusMap[ep.id]
    return {
      ...ep,
      channelName: channelMap[ep.channel_id] || ep.channel_id || '—',
      statusBadge: jobStatus ? <StatusBadge status={jobStatus} /> : <span className="text-gray-400 text-xs">no job</span>,
    }
  })

  async function handleDelete(id: string) {
    'use server'
    await deleteEpisode(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Episodes</h1>
        <Link
          href="/episodes/new"
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
        >
          New Episode
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        onDelete={handleDelete}
        editPath="/episodes"
      />
    </div>
  )
}
