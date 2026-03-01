'use client'

import { useEffect, useState } from 'react'

interface CountdownOverlayProps {
  nextEpisode: { id: string; title: string; order: number }
  onCancel: () => void
  onProceed: () => void
}

export default function CountdownOverlay({ nextEpisode, onCancel, onProceed }: CountdownOverlayProps) {
  const [seconds, setSeconds] = useState(7)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onProceed()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onProceed])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 text-center shadow-xl max-w-xs mx-4" dir="rtl">
        <p className="text-sm text-gray-500 mb-2">قسمت بعدی در {seconds} ثانیه</p>
        <p className="font-bold text-lg mb-1">{nextEpisode.title}</p>
        <p className="text-sm text-gray-400 mb-4">قسمت {nextEpisode.order}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium min-h-[48px]"
          >
            لغو
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium min-h-[48px]"
          >
            پخش
          </button>
        </div>
      </div>
    </div>
  )
}
