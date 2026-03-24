'use client'

import { useMemo } from 'react'
import type { AvatarConfig, AvatarSize, ExpressionState } from '@/lib/types'
import { generateAvatarSvg } from '@/lib/avatar-assets'

interface AnimatedAvatarProps {
  config: AvatarConfig
  expression?: ExpressionState
  size: AvatarSize
  className?: string
}

const SIZE_PX: Record<AvatarSize, number> = { sm: 32, md: 64, lg: 200 }

export default function AnimatedAvatar({ config, expression = 'idle', size, className }: AnimatedAvatarProps) {
  const px = SIZE_PX[size]

  const svg = useMemo(() => generateAvatarSvg(config), [
    config.hair, config.eyes, config.eyebrows, config.mouth,
    config.skinColor, config.hairColor, config.earrings, config.glasses, config.features,
  ])

  // Expression-based CSS animation on the avatar
  const expressionStyle = getExpressionStyle(expression)

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        position: 'relative',
        flexShrink: 0,
        ...expressionStyle,
      }}
      aria-hidden="true"
    >
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}

function getExpressionStyle(expression: ExpressionState): React.CSSProperties {
  switch (expression) {
    case 'happy':
      return { animation: 'kidtube-avatar-bounce-select 500ms cubic-bezier(0.34,1.56,0.64,1)' }
    case 'excited':
    case 'celebrating':
    case 'cheering':
      return { animation: 'kidtube-tab-bounce 600ms cubic-bezier(0.34,1.56,0.64,1)' }
    case 'dancing':
      return { animation: 'kidtube-wiggle 400ms ease-in-out infinite' }
    case 'waving':
      return { animation: 'kidtube-float 2s ease-in-out infinite' }
    case 'sleepy':
      return { animation: 'kidtube-fire-flicker 2s ease-in-out infinite', opacity: 0.7 }
    case 'surprised':
      return { animation: 'kidtube-heart-pop 500ms cubic-bezier(0.34,1.56,0.64,1)' }
    case 'thinking':
    case 'curious':
      return { animation: 'kidtube-float 3s ease-in-out infinite' }
    case 'sad':
      return { opacity: 0.6, transform: 'translateY(2px)', transition: 'all 300ms' }
    case 'watching':
    case 'idle':
    case 'laughing':
    default:
      return {}
  }
}
