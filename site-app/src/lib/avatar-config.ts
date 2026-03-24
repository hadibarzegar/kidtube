import type { AvatarConfig, ExpressionState } from './types'

// --- DiceBear Adventurer Option Arrays ---

// Hair: 19 short + 26 long = 45 variants
export const HAIR_OPTIONS = [
  'short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08', 'short09', 'short10',
  'short11', 'short12', 'short13', 'short14', 'short15', 'short16', 'short17', 'short18', 'short19',
  'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10',
  'long11', 'long12', 'long13', 'long14', 'long15', 'long16', 'long17', 'long18', 'long19', 'long20',
  'long21', 'long22', 'long23', 'long24', 'long25', 'long26',
] as const

export const EYES_OPTIONS = [
  'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08',
  'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16',
  'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24',
  'variant25', 'variant26',
] as const

export const EYEBROWS_OPTIONS = [
  'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08',
  'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15',
] as const

export const MOUTH_OPTIONS = [
  'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08',
  'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16',
  'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24',
  'variant25', 'variant26', 'variant27', 'variant28', 'variant29', 'variant30',
] as const

export const SKIN_COLORS = ['f2d3b1', 'ecad80', 'd08b5b', '9e5622', '763900'] as const

export const HAIR_COLORS = ['0e0e0e', '6a4e35', '562306', 'ac6511', 'b9a05f', 'cb6820', 'ab2a18', '592454', '3eac2c', '85c2c6', 'dba3be', 'e5d7a3', 'afafaf'] as const

export const EARRINGS_OPTIONS = ['none', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06'] as const

export const GLASSES_OPTIONS = ['none', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05'] as const

export const FEATURES_OPTIONS = ['none', 'blush', 'freckles', 'birthmark', 'mustache'] as const

// --- Face Presets (curated eye + eyebrow + mouth combos) ---

export interface FacePreset {
  key: string
  label: string
  eyes: string
  eyebrows: string
  mouth: string
}

export const FACE_PRESETS: FacePreset[] = [
  { key: 'happy', label: 'شاد', eyes: 'variant01', eyebrows: 'variant01', mouth: 'variant01' },
  { key: 'cheerful', label: 'سرحال', eyes: 'variant05', eyebrows: 'variant03', mouth: 'variant06' },
  { key: 'cute', label: 'بامزه', eyes: 'variant12', eyebrows: 'variant02', mouth: 'variant10' },
  { key: 'cool', label: 'باحال', eyes: 'variant03', eyebrows: 'variant06', mouth: 'variant15' },
  { key: 'surprised', label: 'متعجب', eyes: 'variant17', eyebrows: 'variant08', mouth: 'variant20' },
  { key: 'sleepy', label: 'خوابالو', eyes: 'variant07', eyebrows: 'variant04', mouth: 'variant03' },
  { key: 'mischievous', label: 'شیطون', eyes: 'variant09', eyebrows: 'variant10', mouth: 'variant12' },
  { key: 'sweet', label: 'ملوس', eyes: 'variant14', eyebrows: 'variant05', mouth: 'variant08' },
  { key: 'dreamy', label: 'رویایی', eyes: 'variant20', eyebrows: 'variant07', mouth: 'variant05' },
  { key: 'silly', label: 'خنده‌دار', eyes: 'variant22', eyebrows: 'variant12', mouth: 'variant25' },
  { key: 'confident', label: 'مطمئن', eyes: 'variant04', eyebrows: 'variant09', mouth: 'variant18' },
  { key: 'shy', label: 'خجالتی', eyes: 'variant16', eyebrows: 'variant11', mouth: 'variant02' },
  { key: 'excited', label: 'هیجان‌زده', eyes: 'variant26', eyebrows: 'variant14', mouth: 'variant28' },
  { key: 'gentle', label: 'مهربون', eyes: 'variant10', eyebrows: 'variant13', mouth: 'variant09' },
  { key: 'fierce', label: 'جنگجو', eyes: 'variant08', eyebrows: 'variant15', mouth: 'variant22' },
  { key: 'wonder', label: 'کنجکاو', eyes: 'variant24', eyebrows: 'variant01', mouth: 'variant14' },
]

// --- Persian Labels ---

export const CATEGORY_LABELS: Record<string, string> = {
  face: 'صورت',
  hair: 'مو',
  eyes: 'چشم‌ها',
  eyebrows: 'ابرو',
  mouth: 'دهان',
  skin: 'رنگ پوست',
  hairColor: 'رنگ مو',
  earrings: 'گوشواره',
  glasses: 'عینک',
  features: 'ویژگی‌ها',
}

export const SKIN_COLOR_LABELS: Record<string, string> = {
  'f2d3b1': 'روشن', 'ecad80': 'گندمی', 'd08b5b': 'برنزه', '9e5622': 'تیره', '763900': 'خیلی تیره',
}

export const HAIR_COLOR_LABELS: Record<string, string> = {
  '0e0e0e': 'مشکی', '6a4e35': 'قهوه‌ای', '562306': 'قهوه‌ای تیره', 'ac6511': 'عسلی',
  'b9a05f': 'بلوند تیره', 'cb6820': 'نارنجی', 'ab2a18': 'قرمز', '592454': 'بنفش',
  '3eac2c': 'سبز', '85c2c6': 'آبی', 'dba3be': 'صورتی', 'e5d7a3': 'بلوند', 'afafaf': 'خاکستری',
}

export const EARRINGS_LABELS: Record<string, string> = {
  none: 'بدون', variant01: '۱', variant02: '۲', variant03: '۳', variant04: '۴', variant05: '۵', variant06: '۶',
}

export const GLASSES_LABELS: Record<string, string> = {
  none: 'بدون', variant01: '۱', variant02: '۲', variant03: '۳', variant04: '۴', variant05: '۵',
}

export const FEATURES_LABELS: Record<string, string> = {
  none: 'بدون', blush: 'گونه صورتی', freckles: 'کک و مک', birthmark: 'خال', mustache: 'سبیل',
}

// --- Defaults ---

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  hair: 'short01',
  eyes: 'variant01',
  eyebrows: 'variant01',
  mouth: 'variant01',
  skinColor: 'f2d3b1',
  hairColor: '6a4e35',
  earrings: 'none',
  glasses: 'none',
  features: 'none',
}

// --- Expression System ---

export const EXPRESSION_PRIORITY: ExpressionState[] = [
  'celebrating', 'cheering', 'dancing', 'excited', 'happy',
  'surprised', 'laughing', 'sad', 'sleepy', 'curious',
  'watching', 'thinking', 'waving', 'idle',
]

/** Duration in ms for triggered expressions. null = looping (no auto-revert). */
export const EXPRESSION_DURATIONS: Record<ExpressionState, number | null> = {
  idle: null,
  happy: 2000,
  excited: 2500,
  watching: null,
  sleepy: null,
  celebrating: 3000,
  curious: null,
  waving: 2000,
  dancing: 3000,
  laughing: 2000,
  surprised: 1500,
  thinking: null,
  sad: 2000,
  cheering: 3000,
}

/** Frame ranges for each expression within Lottie files. */
export const EXPRESSION_SEGMENTS: Record<ExpressionState, [number, number]> = {
  idle: [0, 120],
  happy: [121, 180],
  excited: [181, 255],
  watching: [256, 376],
  sleepy: [377, 497],
  celebrating: [498, 588],
  curious: [589, 709],
  waving: [710, 770],
  dancing: [771, 861],
  laughing: [862, 922],
  surprised: [923, 968],
  thinking: [969, 1089],
  sad: [1090, 1150],
  cheering: [1151, 1241],
}

// --- Helpers ---

export function isLegacyAvatar(avatar: string | AvatarConfig): avatar is string {
  return typeof avatar === 'string'
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomAvatarConfig(): AvatarConfig {
  return {
    hair: randomFrom(HAIR_OPTIONS),
    eyes: randomFrom(EYES_OPTIONS),
    eyebrows: randomFrom(EYEBROWS_OPTIONS),
    mouth: randomFrom(MOUTH_OPTIONS),
    skinColor: randomFrom(SKIN_COLORS),
    hairColor: randomFrom(HAIR_COLORS),
    earrings: Math.random() > 0.7 ? randomFrom(EARRINGS_OPTIONS.filter(e => e !== 'none')) : 'none',
    glasses: Math.random() > 0.8 ? randomFrom(GLASSES_OPTIONS.filter(g => g !== 'none')) : 'none',
    features: Math.random() > 0.7 ? randomFrom(FEATURES_OPTIONS.filter(f => f !== 'none')) : 'none',
  }
}

export function validateAvatarConfig(config: unknown): AvatarConfig {
  if (!config || typeof config !== 'object') return DEFAULT_AVATAR_CONFIG
  const c = config as Record<string, unknown>
  return {
    hair: HAIR_OPTIONS.includes(c.hair as never) ? (c.hair as string) : DEFAULT_AVATAR_CONFIG.hair,
    eyes: EYES_OPTIONS.includes(c.eyes as never) ? (c.eyes as string) : DEFAULT_AVATAR_CONFIG.eyes,
    eyebrows: EYEBROWS_OPTIONS.includes(c.eyebrows as never) ? (c.eyebrows as string) : DEFAULT_AVATAR_CONFIG.eyebrows,
    mouth: MOUTH_OPTIONS.includes(c.mouth as never) ? (c.mouth as string) : DEFAULT_AVATAR_CONFIG.mouth,
    skinColor: SKIN_COLORS.includes(c.skinColor as never) ? (c.skinColor as string) : DEFAULT_AVATAR_CONFIG.skinColor,
    hairColor: HAIR_COLORS.includes(c.hairColor as never) ? (c.hairColor as string) : DEFAULT_AVATAR_CONFIG.hairColor,
    earrings: EARRINGS_OPTIONS.includes(c.earrings as never) ? (c.earrings as string) : DEFAULT_AVATAR_CONFIG.earrings,
    glasses: GLASSES_OPTIONS.includes(c.glasses as never) ? (c.glasses as string) : DEFAULT_AVATAR_CONFIG.glasses,
    features: FEATURES_OPTIONS.includes(c.features as never) ? (c.features as string) : DEFAULT_AVATAR_CONFIG.features,
  }
}

// --- Legacy Emoji Map (consolidated from duplicates in ProfilePicker, CreateChildModal, onboarding) ---

export const LEGACY_AVATAR_EMOJIS: Record<string, string> = {
  bear: '🐻', cat: '🐱', elephant: '🐘', rabbit: '🐰',
  dolphin: '🐬', penguin: '🐧', butterfly: '🦋', lion: '🦁',
  rocket: '🚀', astronaut: '👨‍🚀', planet: '🪐', star: '⭐',
  flower: '🌸', tree: '🌳', rainbow: '🌈', sun: '☀️',
  robot: '🤖', unicorn: '🦄', wizard: '🧙', pirate: '🏴‍☠️',
  superhero: '🦸', ninja: '🥷', dragon: '🐉', mermaid: '🧜‍♀️',
}

export const LEGACY_AVATAR_CATEGORIES = [
  { label: 'حیوانات', keys: ['bear', 'cat', 'elephant', 'rabbit', 'dolphin', 'penguin', 'butterfly', 'lion'] },
  { label: 'فضا', keys: ['rocket', 'astronaut', 'planet', 'star'] },
  { label: 'طبیعت', keys: ['flower', 'tree', 'rainbow', 'sun'] },
  { label: 'سرگرمی', keys: ['robot', 'unicorn', 'wizard', 'pirate', 'superhero', 'ninja', 'dragon', 'mermaid'] },
]
