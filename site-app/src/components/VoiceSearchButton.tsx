'use client'

import { useState, useEffect, useCallback } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function VoiceSearchButton() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    )
  }, [])

  const handleResult = useCallback((transcript: string) => {
    const input = document.getElementById('search-input') as HTMLInputElement
    const form = document.getElementById('search-form') as HTMLFormElement
    if (input && form) {
      input.value = transcript
      form.submit()
    }
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'fa-IR'
    recognition.continuous = false
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        handleResult(transcript)
      }
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
    setListening(true)
  }, [handleResult])

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={startListening}
      aria-label={listening ? 'در حال گوش دادن...' : 'جستجوی صوتی'}
      className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer ${
        listening
          ? 'text-red-500 bg-red-50'
          : 'text-[var(--color-text-faint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
      }`}
    >
      {/* Pulsing ring when listening */}
      {listening && (
        <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping" />
      )}

      {/* Microphone icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="1" width="6" height="14" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  )
}
