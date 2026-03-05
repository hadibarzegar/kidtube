'use client'

import Link from 'next/link'
import { Tv } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DataTable from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { deleteChannel } from '@/app/actions/channels'

function resolvePreviewUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('/images/')) return `/api/admin${url}`
  return url
}

interface ChannelsClientProps {
  tableData: Record<string, unknown>[]
  totalCount: number
}

export default function ChannelsClient({ tableData, totalCount }: ChannelsClientProps) {
  const columns: Column[] = [
    {
      key: 'thumbnail',
      label: '',
      className: 'w-16',
      render: (val) => {
        const url = resolvePreviewUrl(val as string)
        return url ? (
          <img src={url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Tv className="w-4 h-4 text-muted-foreground" />
          </div>
        )
      },
    },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'categoryName',
      label: 'Category',
      sortable: true,
      render: (val) => {
        const names = (val as string).split(', ').filter((n) => n !== '—')
        if (names.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((n) => (
              <Badge key={n} variant="secondary" className="bg-blue-50 text-blue-700">{n}</Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: 'ageGroupName',
      label: 'Age Group',
      sortable: true,
      render: (val) => {
        const names = (val as string).split(', ').filter((n) => n !== '—')
        if (names.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((n) => (
              <Badge key={n} variant="secondary" className="bg-purple-50 text-purple-700">{n}</Badge>
            ))}
          </div>
        )
      },
    },
    { key: 'created_at', label: 'Created', sortable: true },
  ]

  async function handleDelete(id: string) {
    await deleteChannel(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
          <p className="text-sm text-muted-foreground">{totalCount} channels total</p>
        </div>
        <Button asChild>
          <Link href="/channels/new">New Channel</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        onDelete={handleDelete}
        editPath="/channels"
        searchPlaceholder="Search channels..."
      />
    </div>
  )
}
