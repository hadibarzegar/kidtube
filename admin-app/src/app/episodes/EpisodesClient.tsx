'use client'

import Link from 'next/link'
import { Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DataTable from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { deleteEpisode } from '@/app/actions/episodes'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  downloading: 'bg-blue-100 text-blue-800',
  transcoding: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

function resolvePreviewUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('/images/')) return `/api/admin${url}`
  return url
}

interface EpisodesClientProps {
  tableData: Record<string, unknown>[]
  totalCount: number
}

export default function EpisodesClient({ tableData, totalCount }: EpisodesClientProps) {
  const columns: Column[] = [
    {
      key: 'thumbnail',
      label: '',
      className: 'w-16',
      render: (val) => {
        const url = resolvePreviewUrl(val as string)
        return url ? (
          <img src={url} alt="" className="w-14 h-8 rounded object-cover" />
        ) : (
          <div className="w-14 h-8 rounded bg-muted flex items-center justify-center">
            <Film className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )
      },
    },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'channelName', label: 'Channel', sortable: true },
    { key: 'order', label: 'Order', sortable: true, className: 'w-20' },
    {
      key: 'jobStatus',
      label: 'Status',
      render: (val) => {
        const status = val as string
        if (!status) return <span className="text-xs text-muted-foreground">no job</span>
        return (
          <Badge variant="secondary" className={statusColors[status] ?? 'bg-gray-100 text-gray-800'}>
            {status}
          </Badge>
        )
      },
    },
    { key: 'created_at', label: 'Created', sortable: true },
  ]

  async function handleDelete(id: string) {
    await deleteEpisode(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Episodes</h1>
          <p className="text-sm text-muted-foreground">{totalCount} episodes total</p>
        </div>
        <Button asChild>
          <Link href="/episodes/new">New Episode</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        onDelete={handleDelete}
        editPath="/episodes"
        searchPlaceholder="Search episodes..."
      />
    </div>
  )
}
