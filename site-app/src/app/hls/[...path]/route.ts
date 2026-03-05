import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const HLS_ROOT = process.env.HLS_ROOT ?? join(process.cwd(), '..', 'data', 'hls')

const MIME_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = join(HLS_ROOT, ...path)

  // Prevent path traversal
  if (!filePath.startsWith(HLS_ROOT)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const data = await readFile(filePath)
    const ext = filePath.substring(filePath.lastIndexOf('.'))
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
