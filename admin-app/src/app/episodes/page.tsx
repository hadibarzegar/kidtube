import { cookies } from 'next/headers'
import EpisodesClient from './EpisodesClient'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface Episode {
  id: string
  channel_id: string
  title: string
  description: string
  thumbnail: string
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
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/episodes`, { headers, cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function fetchJobs(): Promise<Job[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/jobs`, { headers, cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function fetchChannels(): Promise<Channel[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/channels`, { headers, cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function EpisodesPage() {
  const [episodes, jobs, channels] = await Promise.all([
    fetchEpisodes(),
    fetchJobs(),
    fetchChannels(),
  ])

  const jobStatusMap: Record<string, string> = {}
  for (const job of jobs) {
    if (job.episode_id) jobStatusMap[job.episode_id] = job.status
  }

  const channelMap = Object.fromEntries(channels.map((c) => [c.id, c.name]))

  const tableData = episodes.map((ep) => ({
    ...ep,
    channelName: channelMap[ep.channel_id] || ep.channel_id || '—',
    jobStatus: jobStatusMap[ep.id] ?? '',
  }))

  return <EpisodesClient tableData={tableData} totalCount={episodes.length} />
}
