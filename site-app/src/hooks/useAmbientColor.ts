'use client'

import { useEffect, useRef, useState } from 'react'

/** Extracts the dominant color from a video element every 2 seconds */
export function useAmbientColor(videoSelector: string, enabled: boolean) {
  const [color, setColor] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setColor(null)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 8
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const extract = () => {
      const video = document.querySelector(videoSelector) as HTMLVideoElement | null
      if (!video || video.paused || video.readyState < 2) return

      try {
        ctx.drawImage(video, 0, 0, 8, 8)
        const data = ctx.getImageData(0, 0, 8, 8).data
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        setColor(`rgba(${r}, ${g}, ${b}, 0.3)`)
      } catch {
        // CORS or security error — ignore
      }
    }

    // Start extracting after a short delay (wait for video to be ready)
    const timeout = setTimeout(() => {
      extract()
      intervalRef.current = setInterval(extract, 2000)
    }, 1000)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [videoSelector, enabled])

  return color
}
