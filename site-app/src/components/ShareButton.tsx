'use client'

import { useState } from 'react'

interface ShareButtonProps {
  episodeId: string
  title: string
}

export default function ShareButton({ episodeId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    const url = `${window.location.origin}/watch/${episodeId}`

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled or share failed — ignore
      }
      return
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        aria-label="اشتراک‌گذاری"
        className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 text-[var(--color-text)] cursor-pointer active:scale-95 hover:bg-[var(--color-border)]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>اشتراک</span>
      </button>

      {copied && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-text)] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-10">
          لینک کپی شد!
        </div>
      )}
    </div>
  )
}
