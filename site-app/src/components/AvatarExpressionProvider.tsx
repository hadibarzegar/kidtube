'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ExpressionState } from '@/lib/types'
import { EXPRESSION_PRIORITY, EXPRESSION_DURATIONS } from '@/lib/avatar-config'

interface AvatarExpressionContextValue {
  expression: ExpressionState
  contextState: ExpressionState
  triggerExpression: (state: ExpressionState) => void
  setContextState: (state: ExpressionState) => void
}

const AvatarExpressionContext = createContext<AvatarExpressionContextValue>({
  expression: 'idle',
  contextState: 'idle',
  triggerExpression: () => {},
  setContextState: () => {},
})

export function useAvatarExpressionContext() {
  return useContext(AvatarExpressionContext)
}

export default function AvatarExpressionProvider({ children }: { children: React.ReactNode }) {
  const [expression, setExpression] = useState<ExpressionState>('idle')
  const [contextState, setContextStateRaw] = useState<ExpressionState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentPriorityRef = useRef<number>(EXPRESSION_PRIORITY.length - 1) // idle = lowest

  const getPriority = useCallback((state: ExpressionState) => {
    const idx = EXPRESSION_PRIORITY.indexOf(state)
    return idx === -1 ? EXPRESSION_PRIORITY.length - 1 : idx
  }, [])

  const triggerExpression = useCallback((state: ExpressionState) => {
    const newPriority = getPriority(state)
    const currentPriority = currentPriorityRef.current

    // Only apply if higher or equal priority (lower index = higher priority)
    if (newPriority > currentPriority) return

    // Clear existing revert timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    currentPriorityRef.current = newPriority
    setExpression(state)

    // Set auto-revert timer for non-looping expressions
    const duration = EXPRESSION_DURATIONS[state]
    if (duration !== null) {
      timerRef.current = setTimeout(() => {
        setExpression((prev) => {
          // Only revert if we're still showing this expression
          if (prev === state) {
            currentPriorityRef.current = getPriority(contextState)
            return contextState
          }
          return prev
        })
        timerRef.current = null
      }, duration)
    }
  }, [contextState, getPriority])

  const setContextState = useCallback((state: ExpressionState) => {
    setContextStateRaw(state)
    // If current expression is lower priority than new context, switch
    const contextPriority = getPriority(state)
    if (contextPriority <= currentPriorityRef.current && !timerRef.current) {
      currentPriorityRef.current = contextPriority
      setExpression(state)
    }
  }, [getPriority])

  return (
    <AvatarExpressionContext.Provider value={{ expression, contextState, triggerExpression, setContextState }}>
      {children}
    </AvatarExpressionContext.Provider>
  )
}
