'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChildProfile } from '@/lib/types'
import { authFetch } from '@/lib/api'
import CreateChildModal from './CreateChildModal'
import KidProofChallenge from './KidProofChallenge'
import PinModal from './PinModal'
import ChildPasscodeModal from './ChildPasscodeModal'

const AVATAR_EMOJIS: Record<string, string> = {
  bear: '🐻', cat: '🐱', elephant: '🐘', rabbit: '🐰',
  dolphin: '🐬', penguin: '🐧', butterfly: '🦋', lion: '🦁',
  rocket: '🚀', astronaut: '👨‍🚀', planet: '🪐', star: '⭐',
  flower: '🌸', tree: '🌳', rainbow: '🌈', sun: '☀️',
  robot: '🤖', unicorn: '🦄', wizard: '🧙', pirate: '🏴‍☠️',
  superhero: '🦸', ninja: '🥷', dragon: '🐉', mermaid: '🧜‍♀️',
}

interface ProfilePickerProps {
  children: ChildProfile[]
  activeChildId: string | null
  hasPIN: boolean
}

export default function ProfilePicker({ children, activeChildId, hasPIN }: ProfilePickerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showChallenge, setShowChallenge] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [passcodeChildId, setPasscodeChildId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function activateChild(childId: string) {
    setLoading(childId)
    setError(null)
    try {
      const res = await authFetch(`/me/children/${childId}/activate`, { method: 'POST' })
      if (!res.ok) {
        setError('فعال‌سازی پروفایل ناموفق بود')
        return
      }
      router.refresh()
      router.push('/')
    } catch {
      setError('اتصال به سرور برقرار نشد')
    } finally {
      setLoading(null)
    }
  }

  async function handleParentMode(pin: string) {
    setError(null)
    try {
      const res = await authFetch('/me/children/deactivate', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) {
        setError('رمز والدین اشتباه است')
        return
      }
      setShowPinModal(false)
      router.refresh()
      router.push('/')
    } catch {
      setError('اتصال به سرور برقرار نشد')
    }
  }

  function handleParentModeClick() {
    setShowChallenge(true)
  }

  function handleChallengeSuccess() {
    setShowChallenge(false)
    if (hasPIN) {
      setShowPinModal(true)
    } else {
      handleParentMode('')
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => {
              if (child.has_passcode) {
                setPasscodeChildId(child.id)
              } else {
                activateChild(child.id)
              }
            }}
            disabled={loading !== null}
            className={`flex flex-col items-center gap-3 p-6 rounded-[20px] border-[3px] transition-all duration-200 cursor-pointer ${
              activeChildId === child.id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-hover)] shadow-[var(--clay-shadow-hover)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] hover:border-[var(--color-primary)]'
            } ${loading === child.id ? 'opacity-70' : ''}`}
          >
            <span className="text-5xl" role="img" aria-label={child.avatar}>
              {AVATAR_EMOJIS[child.avatar] ?? '⭐'}
            </span>
            <span className="text-sm font-bold text-[var(--color-text)]">{child.name}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{child.age} ساله</span>
          </button>
        ))}

        {/* Add Child button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-[20px] border-[3px] border-dashed border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] hover:border-[var(--color-primary)] transition-all duration-200 cursor-pointer"
        >
          <span className="text-4xl text-[var(--color-text-muted)]">+</span>
          <span className="text-sm font-medium text-[var(--color-text-muted)]">افزودن کودک</span>
        </button>
      </div>

      {/* Parent Mode button */}
      <div className="flex justify-center">
        <button
          onClick={handleParentModeClick}
          className="h-9 px-4 rounded-full text-sm font-semibold bg-[var(--color-surface)] text-[var(--color-text)] border-[3px] border-[var(--color-border)] shadow-[var(--clay-shadow)] hover:shadow-[var(--clay-shadow-hover)] transition-all duration-200 cursor-pointer"
        >
          حالت والدین
        </button>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)] bg-[#FFF0F0] rounded-2xl border-[3px] border-[#FFD4D4] px-3 py-2 mt-4 text-center">
          {error}
        </p>
      )}

      {showCreateModal && (
        <CreateChildModal
          onCreated={() => {
            setShowCreateModal(false)
            router.refresh()
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showChallenge && (
        <KidProofChallenge
          onSuccess={handleChallengeSuccess}
          onCancel={() => setShowChallenge(false)}
        />
      )}

      {showPinModal && (
        <PinModal
          mode="verify"
          onVerified={handleParentMode}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {passcodeChildId && (
        <ChildPasscodeModal
          childId={passcodeChildId}
          onSuccess={() => {
            const id = passcodeChildId
            setPasscodeChildId(null)
            activateChild(id)
          }}
          onCancel={() => setPasscodeChildId(null)}
        />
      )}
    </>
  )
}
