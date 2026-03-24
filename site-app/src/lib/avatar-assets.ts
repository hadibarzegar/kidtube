import { createAvatar } from '@dicebear/core'
import * as adventurer from '@dicebear/adventurer'
import type { AvatarConfig } from './types'

// --- Color Display Maps (for color swatches in the builder) ---

export const SKIN_COLOR_HEX: Record<string, string> = {
  'f2d3b1': '#f2d3b1',
  'ecad80': '#ecad80',
  'd08b5b': '#d08b5b',
  '9e5622': '#9e5622',
  '763900': '#763900',
}

export const HAIR_COLOR_HEX: Record<string, string> = {
  '0e0e0e': '#0e0e0e',
  '6a4e35': '#6a4e35',
  '562306': '#562306',
  'ac6511': '#ac6511',
  'b9a05f': '#b9a05f',
  'cb6820': '#cb6820',
  'ab2a18': '#ab2a18',
  '592454': '#592454',
  '3eac2c': '#3eac2c',
  '85c2c6': '#85c2c6',
  'dba3be': '#dba3be',
  'e5d7a3': '#e5d7a3',
  'afafaf': '#afafaf',
}

// --- DiceBear Avatar Generation ---

export function generateAvatarSvg(config: AvatarConfig): string {
  const options: Record<string, unknown> = {
    hair: [config.hair],
    eyes: [config.eyes],
    eyebrows: [config.eyebrows],
    mouth: [config.mouth],
    skinColor: [config.skinColor],
    hairColor: [config.hairColor],
    // Only include optional parts if not 'none'
    earringsProbability: config.earrings === 'none' ? 0 : 100,
    glassesProbability: config.glasses === 'none' ? 0 : 100,
    featuresProbability: config.features === 'none' ? 0 : 100,
    backgroundColor: ['transparent'],
  }

  if (config.earrings !== 'none') {
    options.earrings = [config.earrings]
  }
  if (config.glasses !== 'none') {
    options.glasses = [config.glasses]
  }
  if (config.features !== 'none') {
    options.features = [config.features]
  }

  const avatar = createAvatar(adventurer, options)
  return avatar.toString()
}

export function generateAvatarDataUri(config: AvatarConfig): string {
  const svg = generateAvatarSvg(config)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// --- Lottie (kept for future use with real animation files) ---

export function getLottieUrl(bodyShape: string): string {
  return `/avatars/lottie/expressions/body-${bodyShape || 'round'}.json`
}
