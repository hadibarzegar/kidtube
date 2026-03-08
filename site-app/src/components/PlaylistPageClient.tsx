'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreatePlaylistModal from '@/components/CreatePlaylistModal'

export default function PlaylistPageClient() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="clay-btn px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)]"
      >
        ایجاد لیست جدید
      </button>
      {showModal && (
        <CreatePlaylistModal
          onCreated={() => router.refresh()}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
