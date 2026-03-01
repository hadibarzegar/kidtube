'use client'

import dynamic from 'next/dynamic'

// MUST use dynamic import with ssr:false in a Client Component file
// Video.js uses document/window at import time — crashes in SSR
const VideoPlayer = dynamic(
  () => import('./VideoPlayer').then(m => ({ default: m.VideoPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export { VideoPlayer }
