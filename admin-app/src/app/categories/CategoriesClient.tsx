'use client'

import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { deleteCategory } from '@/app/actions/categories'

function resolvePreviewUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('/images/')) return `/api/admin${url}`
  return url
}

interface CategoriesClientProps {
  tableData: Record<string, unknown>[]
  totalCount: number
}

export default function CategoriesClient({ tableData, totalCount }: CategoriesClientProps) {
  const columns: Column[] = [
    {
      key: 'thumbnail',
      label: '',
      className: 'w-16',
      render: (val) => {
        const url = resolvePreviewUrl(val as string)
        return url ? (
          <img src={url} alt="" className="w-10 h-10 rounded object-cover" />
        ) : (
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          </div>
        )
      },
    },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
  ]

  async function handleDelete(id: string) {
    await deleteCategory(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">{totalCount} categories total</p>
        </div>
        <Button asChild>
          <Link href="/categories/new">New Category</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        onDelete={handleDelete}
        editPath="/categories"
        searchPlaceholder="Search categories..."
      />
    </div>
  )
}
