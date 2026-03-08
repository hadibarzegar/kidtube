'use client'

import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import FeatureTooltip from './FeatureTooltip'

export default function OnboardingTour() {
  const { currentStep, completed, steps, next, skip } = useOnboardingTour()

  if (completed || currentStep < 0 || currentStep >= steps.length) return null

  const step = steps[currentStep]
  return (
    <FeatureTooltip
      targetSelector={step.selector}
      message={step.message}
      position={step.position}
      onNext={next}
      onSkip={skip}
      stepNumber={currentStep + 1}
      totalSteps={steps.length}
    />
  )
}
