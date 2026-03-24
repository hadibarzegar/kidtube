'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import type { AvatarConfig } from '@/lib/types'
import {
  HAIR_OPTIONS, EYES_OPTIONS, EYEBROWS_OPTIONS, MOUTH_OPTIONS,
  SKIN_COLORS, HAIR_COLORS, EARRINGS_OPTIONS, GLASSES_OPTIONS, FEATURES_OPTIONS,
  CATEGORY_LABELS, SKIN_COLOR_LABELS, HAIR_COLOR_LABELS,
  EARRINGS_LABELS, GLASSES_LABELS, FEATURES_LABELS,
  FACE_PRESETS,
  randomAvatarConfig,
} from '@/lib/avatar-config'
import { SKIN_COLOR_HEX, HAIR_COLOR_HEX, generateAvatarSvg } from '@/lib/avatar-assets'
import AnimatedAvatar from './AnimatedAvatar'

type TabKey = 'face' | 'hair' | 'eyes' | 'eyebrows' | 'mouth' | 'skin' | 'hairColor' | 'earrings' | 'glasses' | 'features'

interface AvatarBuilderProps {
  value: AvatarConfig
  onChange: (config: AvatarConfig) => void
  onDone: () => void
  compact?: boolean
}

const TABS: TabKey[] = ['face', 'hair', 'eyes', 'mouth', 'eyebrows', 'skin', 'hairColor', 'earrings', 'glasses', 'features']

export default function AvatarBuilder({ value, onChange, onDone, compact }: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('face')
  const [previewExpression, setPreviewExpression] = useState<'idle' | 'happy' | 'excited'>('idle')
  const [spinning, setSpinning] = useState(false)
  const expressionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerHappy = useCallback(() => {
    if (expressionTimer.current) clearTimeout(expressionTimer.current)
    setPreviewExpression('happy')
    expressionTimer.current = setTimeout(() => setPreviewExpression('idle'), 1500)
  }, [])

  const update = useCallback((partial: Partial<AvatarConfig>) => {
    onChange({ ...value, ...partial })
    triggerHappy()
  }, [value, onChange, triggerHappy])

  const handleRandomize = useCallback(() => {
    onChange(randomAvatarConfig())
    setSpinning(true)
    if (expressionTimer.current) clearTimeout(expressionTimer.current)
    setPreviewExpression('excited')
    expressionTimer.current = setTimeout(() => {
      setPreviewExpression('idle')
      setSpinning(false)
    }, 2000)
  }, [onChange])

  const previewSize = compact ? 'md' as const : 'lg' as const

  return (
    <div className={`flex ${compact ? 'flex-col gap-3' : 'flex-col md:flex-row gap-4'}`}>
      {/* Live Preview */}
      <div className={`flex items-center justify-center ${compact ? 'py-3' : 'py-6 md:w-[240px] md:flex-shrink-0'}`}>
        <div
          className="transition-transform duration-500"
          style={spinning ? { animation: 'kidtube-avatar-spin 600ms cubic-bezier(0.34,1.56,0.64,1)' } : undefined}
        >
          <AnimatedAvatar config={value} expression={previewExpression} size={previewSize} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                'border-2',
                activeTab === tab
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[var(--clay-shadow)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]',
              ].join(' ')}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Options Grid */}
        <div className={`overflow-y-auto ${compact ? 'max-h-[200px]' : 'max-h-[300px]'} px-1`}>
          {activeTab === 'face' && (
            <FacePresetGrid
              config={value}
              onSelect={(eyes, eyebrows, mouth) => update({ eyes, eyebrows, mouth })}
            />
          )}
          {activeTab === 'hair' && (
            <VariantGrid
              options={HAIR_OPTIONS}
              selected={value.hair}
              onSelect={(v) => update({ hair: v })}
              config={value}
              previewKey="hair"
            />
          )}
          {activeTab === 'eyes' && (
            <VariantGrid
              options={EYES_OPTIONS}
              selected={value.eyes}
              onSelect={(v) => update({ eyes: v })}
              config={value}
              previewKey="eyes"
            />
          )}
          {activeTab === 'eyebrows' && (
            <VariantGrid
              options={EYEBROWS_OPTIONS}
              selected={value.eyebrows}
              onSelect={(v) => update({ eyebrows: v })}
              config={value}
              previewKey="eyebrows"
            />
          )}
          {activeTab === 'mouth' && (
            <VariantGrid
              options={MOUTH_OPTIONS}
              selected={value.mouth}
              onSelect={(v) => update({ mouth: v })}
              config={value}
              previewKey="mouth"
            />
          )}
          {activeTab === 'skin' && (
            <ColorGrid
              options={SKIN_COLORS}
              selected={value.skinColor}
              onSelect={(v) => update({ skinColor: v })}
              colorMap={SKIN_COLOR_HEX}
              labels={SKIN_COLOR_LABELS}
              large
            />
          )}
          {activeTab === 'hairColor' && (
            <ColorGrid
              options={HAIR_COLORS}
              selected={value.hairColor}
              onSelect={(v) => update({ hairColor: v })}
              colorMap={HAIR_COLOR_HEX}
              labels={HAIR_COLOR_LABELS}
              large
            />
          )}
          {activeTab === 'earrings' && (
            <LabelGrid
              options={EARRINGS_OPTIONS}
              selected={value.earrings}
              onSelect={(v) => update({ earrings: v })}
              labels={EARRINGS_LABELS}
            />
          )}
          {activeTab === 'glasses' && (
            <LabelGrid
              options={GLASSES_OPTIONS}
              selected={value.glasses}
              onSelect={(v) => update({ glasses: v })}
              labels={GLASSES_LABELS}
            />
          )}
          {activeTab === 'features' && (
            <LabelGrid
              options={FEATURES_OPTIONS}
              selected={value.features}
              onSelect={(v) => update({ features: v })}
              labels={FEATURES_LABELS}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleRandomize}
            className="flex-1 py-2 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-secondary)] active:scale-95 transition-all duration-200"
          >
            🎲 تصادفی
          </button>
          <button
            type="button"
            onClick={onDone}
            className="flex-1 py-2 rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)] text-white text-sm font-semibold hover:brightness-105 active:scale-95 transition-all duration-200 shadow-[var(--clay-shadow)]"
          >
            ✓ تأیید
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function VariantGrid({
  options,
  selected,
  onSelect,
  config,
  previewKey,
}: {
  options: readonly string[]
  selected: string
  onSelect: (value: string) => void
  config: AvatarConfig
  previewKey: string
}) {
  // Generate mini preview SVGs for each variant
  const previews = useMemo(() => {
    const map: Record<string, string> = {}
    for (const opt of options) {
      const previewConfig = { ...config, [previewKey]: opt }
      map[opt] = generateAvatarSvg(previewConfig)
    }
    return map
    // Only regenerate when the base config changes (excluding the key we're iterating)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.skinColor, config.hairColor, previewKey])

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {options.map((opt) => {
        const isSelected = opt === selected
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            aria-label={opt}
            className={[
              'flex items-center justify-center p-1 rounded-2xl border-2 transition-all duration-200',
              'bg-[var(--color-surface)] hover:shadow-[var(--clay-shadow)] aspect-square',
              isSelected
                ? 'border-[var(--color-primary)] scale-105 shadow-[var(--clay-shadow)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-secondary)]',
              'active:scale-95',
            ].join(' ')}
          >
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: previews[opt] || '' }}
            />
          </button>
        )
      })}
    </div>
  )
}

function ColorGrid({
  options,
  selected,
  onSelect,
  colorMap,
  labels,
  large,
}: {
  options: readonly string[]
  selected: string
  onSelect: (value: string) => void
  colorMap: Record<string, string>
  labels: Record<string, string>
  large?: boolean
}) {
  const size = large ? 'w-12 h-12' : 'w-8 h-8'
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = opt === selected
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            aria-label={labels[opt] || opt}
            title={labels[opt] || opt}
            className={[
              size,
              'rounded-full border-3 transition-all duration-200',
              isSelected
                ? 'border-[var(--color-primary)] scale-110 shadow-[var(--clay-shadow)]'
                : 'border-[var(--color-border)] hover:scale-105',
              'active:scale-95',
            ].join(' ')}
            style={{ backgroundColor: colorMap[opt] || '#ccc' }}
          />
        )
      })}
    </div>
  )
}

function LabelGrid({
  options,
  selected,
  onSelect,
  labels,
}: {
  options: readonly string[]
  selected: string
  onSelect: (value: string) => void
  labels: Record<string, string>
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {options.map((opt) => {
        const isSelected = opt === selected
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            aria-label={labels[opt] || opt}
            className={[
              'flex items-center justify-center p-2 rounded-2xl border-2 transition-all duration-200',
              'bg-[var(--color-surface)] hover:shadow-[var(--clay-shadow)] text-xs font-medium',
              isSelected
                ? 'border-[var(--color-primary)] scale-105 shadow-[var(--clay-shadow)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-secondary)] text-[var(--color-text-muted)]',
              'active:scale-95',
            ].join(' ')}
          >
            {labels[opt] || opt}
          </button>
        )
      })}
    </div>
  )
}

function FacePresetGrid({
  config,
  onSelect,
}: {
  config: AvatarConfig
  onSelect: (eyes: string, eyebrows: string, mouth: string) => void
}) {
  const previews = useMemo(() => {
    const map: Record<string, string> = {}
    for (const preset of FACE_PRESETS) {
      const previewConfig = { ...config, eyes: preset.eyes, eyebrows: preset.eyebrows, mouth: preset.mouth }
      map[preset.key] = generateAvatarSvg(previewConfig)
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.skinColor, config.hairColor, config.hair])

  // Determine which preset is currently active (if any)
  const activePreset = FACE_PRESETS.find(
    p => p.eyes === config.eyes && p.eyebrows === config.eyebrows && p.mouth === config.mouth
  )?.key

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {FACE_PRESETS.map((preset) => {
        const isSelected = preset.key === activePreset
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onSelect(preset.eyes, preset.eyebrows, preset.mouth)}
            aria-label={preset.label}
            className={[
              'flex flex-col items-center gap-1 p-1 rounded-2xl border-2 transition-all duration-200',
              'bg-[var(--color-surface)] hover:shadow-[var(--clay-shadow)]',
              isSelected
                ? 'border-[var(--color-primary)] scale-105 shadow-[var(--clay-shadow)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-secondary)]',
              'active:scale-95',
            ].join(' ')}
          >
            <div
              className="w-12 h-12"
              dangerouslySetInnerHTML={{ __html: previews[preset.key] || '' }}
            />
            <span className="text-[10px] text-[var(--color-text-muted)] leading-tight">
              {preset.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
