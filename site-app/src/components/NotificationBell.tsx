'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { authFetch } from '@/lib/api'
import type { AppNotification } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'همین الان'
  if (mins < 60) return `${mins} دقیقه پیش`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ساعت پیش`
  const days = Math.floor(hours / 24)
  return `${days} روز پیش`
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await authFetch('/me/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count ?? 0)
      }
    } catch {
      // Ignore
    }
  }, [])

  // Poll unread count every 60 seconds
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function handleToggle() {
    if (!open) {
      setLoadingList(true)
      try {
        const res = await authFetch('/me/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch {
        // Ignore
      } finally {
        setLoadingList(false)
      }
    }
    setOpen((prev) => !prev)
  }

  async function handleReadAll() {
    try {
      const res = await authFetch('/me/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    } catch {
      // Ignore
    }
  }

  function handleNotificationClick(notif: AppNotification) {
    if (notif.episode_id) {
      window.location.href = `/watch/${notif.episode_id}`
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        aria-label="اعلان‌ها"
        className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-pointer hover:bg-[var(--color-border)]"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-[var(--color-text)]"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--color-error)] text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '۹۹+' : unreadCount.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--color-surface)] rounded-[var(--clay-radius)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-text)]">اعلان‌ها</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="text-xs text-[var(--color-primary)] font-medium cursor-pointer hover:underline"
              >
                خواندن همه
              </button>
            )}
          </div>

          {/* Content */}
          {loadingList ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              اعلانی وجود ندارد
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-right px-4 py-3 border-b border-[var(--color-border)] last:border-b-0 transition-colors duration-150 cursor-pointer hover:bg-[var(--color-primary-hover)] ${
                    !notif.read ? 'bg-[var(--color-primary-hover)]' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--color-text)] leading-snug">
                    {notif.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    {notif.body}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-faint)] mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
