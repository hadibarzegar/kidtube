import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Film,
  Tv,
  FolderOpen,
  Cog,
  Plus,
  ArrowRight,
} from 'lucide-react'

const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${ADMIN_API_INTERNAL_URL}${path}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface Episode {
  id: string
  title: string
  thumbnail: string
  channel_id: string
  created_at: string
}

interface Channel {
  id: string
  name: string
}

interface Job {
  id: string
  status: string
  episode_id: string
}

interface Category {
  id: string
  name: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  downloading: 'bg-blue-100 text-blue-800',
  transcoding: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default async function DashboardPage() {
  const [episodes, channels, categories, jobs] = await Promise.all([
    fetchJSON<Episode[]>('/episodes'),
    fetchJSON<Channel[]>('/channels'),
    fetchJSON<Category[]>('/categories'),
    fetchJSON<Job[]>('/jobs'),
  ])

  const episodeCount = episodes?.length ?? 0
  const channelCount = channels?.length ?? 0
  const categoryCount = categories?.length ?? 0

  const activeJobs = jobs?.filter((j) => j.status !== 'ready' && j.status !== 'failed').length ?? 0
  const failedJobs = jobs?.filter((j) => j.status === 'failed').length ?? 0

  const channelMap = Object.fromEntries((channels ?? []).map((c) => [c.id, c.name]))
  const recentEpisodes = (episodes ?? []).slice(0, 5)

  // Job status summary
  const jobStatusCounts: Record<string, number> = {}
  for (const job of jobs ?? []) {
    jobStatusCounts[job.status] = (jobStatusCounts[job.status] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your KidTube content</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/episodes/new">
              <Plus className="w-4 h-4 mr-1" />
              New Episode
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/channels/new">
              <Plus className="w-4 h-4 mr-1" />
              New Channel
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Episodes</CardTitle>
            <Film className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{episodeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
            <Tv className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{channelCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categoryCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <Cog className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeJobs}</div>
            {failedJobs > 0 && (
              <p className="text-xs text-destructive mt-1">{failedJobs} failed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout: Recent Episodes + Quick Actions / Job Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Episodes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Episodes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/episodes">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentEpisodes.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-muted-foreground">No episodes yet.</div>
            ) : (
              <div className="divide-y">
                {recentEpisodes.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/episodes/${ep.id}`}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-16 h-9 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {ep.thumbnail ? (
                        <img
                          src={ep.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground">
                        {channelMap[ep.channel_id] || 'Unknown channel'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {ep.created_at ? new Date(ep.created_at).toLocaleDateString() : ''}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Job Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(jobStatusCounts).length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(jobStatusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={statusColors[status] ?? 'bg-gray-100 text-gray-800'}
                      >
                        {status}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link href="/jobs">View all jobs</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" size="sm">
                <Link href="/episodes/new">
                  <Plus className="w-4 h-4 mr-1" />
                  New Episode
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/channels/new">
                  <Plus className="w-4 h-4 mr-1" />
                  New Channel
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/categories/new">
                  <Plus className="w-4 h-4 mr-1" />
                  New Category
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
