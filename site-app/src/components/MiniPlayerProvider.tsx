'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface MiniPlayerState {
  active: boolean
  episodeId: string
  hlsSrc: string
  title: string
  channelName: string
  currentTime: number
}

interface MiniPlayerContextValue {
  state: MiniPlayerState | null
  activate: (data: Omit<MiniPlayerState, 'active'>) => void
  deactivate: () => void
  updateTime: (time: number) => void
}

const MiniPlayerContext = createContext<MiniPlayerContextValue>({
  state: null,
  activate: () => {},
  deactivate: () => {},
  updateTime: () => {},
})

export function useMiniPlayer() {
  return useContext(MiniPlayerContext)
}

export default function MiniPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniPlayerState | null>(null)

  const activate = useCallback((data: Omit<MiniPlayerState, 'active'>) => {
    setState({ ...data, active: true })
  }, [])

  const deactivate = useCallback(() => {
    setState(null)
  }, [])

  const updateTime = useCallback((time: number) => {
    setState(prev => prev ? { ...prev, currentTime: time } : null)
  }, [])

  return (
    <MiniPlayerContext.Provider value={{ state, activate, deactivate, updateTime }}>
      {children}
    </MiniPlayerContext.Provider>
  )
}
