'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import type { ChildProfile } from '@/lib/types'
import { isLegacyAvatar, LEGACY_AVATAR_EMOJIS, validateAvatarConfig } from '@/lib/avatar-config'
import AnimatedAvatar from './AnimatedAvatar'

interface ProfileDropdownProps {
  email: string
  activeChild?: ChildProfile | null
}

export default function ProfileDropdown({ email, activeChild }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = email?.charAt(0)?.toUpperCase() ?? '?'

  function renderAvatarButton() {
    if (activeChild && !isLegacyAvatar(activeChild.avatar)) {
      return (
        <AnimatedAvatar
          config={validateAvatarConfig(activeChild.avatar)}
          size="sm"
        />
      )
    }
    if (activeChild && isLegacyAvatar(activeChild.avatar)) {
      return (
        <span className="text-lg" role="img" aria-label={activeChild.avatar}>
          {LEGACY_AVATAR_EMOJIS[activeChild.avatar] ?? '⭐'}
        </span>
      )
    }
    return <span>{initial}</span>
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar circle */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="منوی حساب کاربری"
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors shadow-[var(--clay-shadow)] overflow-hidden"
      >
        {renderAvatarButton()}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-[var(--color-surface)] rounded-[20px] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow-hover)] py-2 min-w-[200px] z-50">
          {/* User email */}
          <div className="px-4 py-2 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] truncate">
            {email}
          </div>

          <Link
            href="/subscriptions"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            کانال‌های من
          </Link>

          <Link
            href="/bookmarks"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            نشان‌شده‌ها
          </Link>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-hover)] transition-colors no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            حساب کاربری
          </Link>

          <div className="border-t border-[var(--color-border)] my-1" />

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              خروج
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
