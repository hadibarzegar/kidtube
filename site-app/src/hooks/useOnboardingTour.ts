'use client'

import { useState, useCallback, useEffect } from 'react'

interface TourStep {
  selector: string
  message: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="search"]', message: 'اینجا می‌تونی جستجو کنی!', position: 'bottom' },
  { selector: '[data-tour="sidebar"]', message: 'منوی اصلی اینجاست', position: 'bottom' },
  { selector: '[data-tour="profiles"]', message: 'پروفایل‌ها رو اینجا عوض کن', position: 'bottom' },
  { selector: '[data-tour="bookmarks"]', message: 'ویدیوهای مورد علاقه رو ذخیره کن', position: 'left' },
]

export function useOnboardingTour() {
  const [currentStep, setCurrentStep] = useState(-1) // -1 means not started/completed
  const [completed, setCompleted] = useState(true)

  useEffect(() => {
    const done = localStorage.getItem('onboarding_tour_done')
    if (!done) {
      // Delay start slightly so DOM elements are ready
      setTimeout(() => {
        setCompleted(false)
        setCurrentStep(0)
      }, 2000)
    }
  }, [])

  const next = useCallback(() => {
    setCurrentStep(prev => {
      const nextStep = prev + 1
      if (nextStep >= TOUR_STEPS.length) {
        setCompleted(true)
        localStorage.setItem('onboarding_tour_done', 'true')
        return -1
      }
      return nextStep
    })
  }, [])

  const skip = useCallback(() => {
    setCompleted(true)
    setCurrentStep(-1)
    localStorage.setItem('onboarding_tour_done', 'true')
  }, [])

  return {
    currentStep,
    completed,
    steps: TOUR_STEPS,
    next,
    skip,
  }
}
