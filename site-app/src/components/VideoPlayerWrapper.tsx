'use client'

import dynamic from 'next/dynamic'

// MUST use dynamic import with ssr:false in a Client Component file
// Video.js uses document/window at import time — crashes in SSR
const VideoPlayer = dynamic(
  () => import('./VideoPlayer').then(m => ({ default: m.VideoPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#2D2D3A] rounded-[inherit] flex flex-col items-center justify-center gap-4">
        {/* Animated play icon */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center animate-pulse shadow-[0_4px_20px_rgba(255,138,122,0.5)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-white/60 text-sm font-medium">در حال بارگذاری...</span>
      </div>
    ),
  }
)

export { VideoPlayer }
