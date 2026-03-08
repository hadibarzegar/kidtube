'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

interface SoundContextValue {
  play: (name: string) => void
  enabled: boolean
  setEnabled: (v: boolean) => void
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
  enabled: false,
  setEnabled: () => {},
})

export function useSoundContext() {
  return useContext(SoundContext)
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map())

  useEffect(() => {
    const stored = localStorage.getItem('sound_enabled')
    setEnabled(stored === 'true')
  }, [])

  const updateEnabled = useCallback((v: boolean) => {
    setEnabled(v)
    localStorage.setItem('sound_enabled', String(v))
  }, [])

  const play = useCallback((name: string) => {
    if (!enabled) return
    try {
      let audio = audioCache.current.get(name)
      if (!audio) {
        audio = new Audio(`/sounds/${name}.mp3`)
        audioCache.current.set(name, audio)
      }
      audio.currentTime = 0
      audio.play().catch(() => {}) // Ignore autoplay policy errors
    } catch {
      // Silently fail
    }
  }, [enabled])

  return (
    <SoundContext.Provider value={{ play, enabled, setEnabled: updateEnabled }}>
      {children}
    </SoundContext.Provider>
  )
}
