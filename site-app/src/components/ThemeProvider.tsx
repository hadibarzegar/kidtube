'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'ocean'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light')

  const applyTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
    document.cookie = `kidtube-theme=${t};path=/;max-age=31536000;SameSite=Lax`
  }, [])

  // Read saved theme on mount, or auto-detect from OS preference
  useEffect(() => {
    const saved = localStorage.getItem('kidtube-theme') as Theme | null
    if (saved && ['light', 'dark', 'ocean'].includes(saved)) {
      applyTheme(saved)
    } else {
      // No manual selection — auto-detect from OS
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
      const autoTheme: Theme = prefersDark.matches ? 'dark' : 'light'
      applyTheme(autoTheme) // Don't save to localStorage so auto-detect stays active

      const handler = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't manually picked a theme
        if (!localStorage.getItem('kidtube-theme')) {
          applyTheme(e.matches ? 'dark' : 'light')
        }
      }
      prefersDark.addEventListener('change', handler)
      return () => prefersDark.removeEventListener('change', handler)
    }
  }, [applyTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme)
    localStorage.setItem('kidtube-theme', newTheme)
  }, [applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
