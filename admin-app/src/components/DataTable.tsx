'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface DataTableProps {
  columns: Column[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  onDelete?: (id: string) => void
  editPath?: string
}

type SortDirection = 'asc' | 'desc' | null

export default function DataTable({ columns, data, onDelete, editPath }: DataTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function sortIcon(key: string) {
    if (sortKey !== key) return <span className="ml-1 text-slate-400">↕</span>
    return (
      <span className="ml-1 text-slate-700">
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  }`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && sortIcon(col.key)}
                </th>
              ))}
              {(editPath || onDelete) && (
                <th className="px-4 py-2.5 text-right font-semibold text-gray-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (editPath || onDelete ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                  {(editPath || onDelete) && (
                    <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                      {editPath && (
                        <Link
                          href={`${editPath}/${row.id}`}
                          className="text-slate-700 hover:underline font-medium"
                        >
                          Edit
                        </Link>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row.id)}
                          className="text-red-600 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
