'use client'

import { useTheme } from '@/components/ThemeProvider'

const THEME_CYCLE = {
  light: 'dark',
  dark: 'ocean',
  ocean: 'light',
} as const

const THEME_ICONS: Record<string, string> = {
  light: '\u2600\uFE0F',  // sun
  dark: '\uD83C\uDF19',   // crescent moon
  ocean: '\uD83C\uDF0A',  // wave
}

const THEME_LABELS: Record<string, string> = {
  light: 'روشن',
  dark: 'تاریک',
  ocean: 'اقیانوس',
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function handleClick() {
    const next = THEME_CYCLE[theme] as 'light' | 'dark' | 'ocean'
    setTheme(next)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`تغییر پوسته به ${THEME_LABELS[THEME_CYCLE[theme]]}`}
      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--color-text)] rounded-[var(--clay-radius-sm)] transition-colors duration-150 cursor-pointer hover:bg-[var(--color-primary-hover)]"
    >
      <span className="text-lg">{THEME_ICONS[theme]}</span>
      <span>پوسته: {THEME_LABELS[theme]}</span>
    </button>
  )
}
