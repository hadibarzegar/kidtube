'use client'

import { Badge } from '@/components/ui/badge'

interface Props {
  status: string
}

const colorMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  downloading: 'bg-blue-100 text-blue-800',
  transcoding: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: Props) {
  const colorClass = colorMap[status] ?? 'bg-gray-100 text-gray-800'

  return (
    <Badge variant="secondary" className={colorClass}>
      {status}
    </Badge>
  )
}
