# Animated Avatars — Design Spec

## Overview

Customizable chibi/cartoon animated characters that replace the current emoji-based avatar system. Characters are built from layered SVGs for appearance and Lottie animations for 14 expression states. Avatars appear throughout the app — from profile picker to a floating companion — reacting to user interactions in real time.

## Character Anatomy

The character is composed of 7 layers stacked in render order:

| Layer | Category | Type | Description |
|-------|----------|------|-------------|
| 7 (top) | Accessory | SVG | Hat, glasses, bow, headband, crown, etc. |
| 6 | Hair | SVG | 12 styles × 8 colors |
| 5 | Face Expressions | Lottie | Animated overlay — expressions animate here, visually overrides eyes during expression states |
| 4 | Eyes | SVG | 6 styles — visible as the default/resting eye look; Lottie expressions draw over them when active |
| 3 | Outfit | SVG | 10 styles × 10 colors |
| 2 | Body Shape | SVG | 6 base shapes |
| 1 (bottom) | Skin Tone | CSS fill | 8 tones applied to body + face SVGs |

## Customization Options

| Category | Options | Count |
|----------|---------|-------|
| Body Shape | Round, Tall, Small, Wide, Slim, Square | 6 |
| Skin Tone | 8 inclusive tones | 8 |
| Hair Style | Short, Long, Curly, Spiky, Braids, Ponytail, Mohawk, Buns, Wavy, Bob, Afro, Bald | 12 |
| Hair Color | Black, Brown, Blonde, Red, Blue, Pink, Purple, Green | 8 |
| Eyes | Round, Big, Sleepy, Cat, Sparkle, Happy | 6 |
| Outfit Style | T-shirt, Hoodie, Dress, Overalls, Cape, Sweater, Jacket, Tank, Robe, Pajamas | 10 |
| Outfit Color | 10 colors from KidTube palette | 10 |
| Accessory | None, Glasses, Sunglasses, Hat, Crown, Bow, Headband, Scarf, Earrings, Mask | 10 |

**Total unique combinations:** 6 × 8 × 12 × 8 × 6 × 10 × 10 × 10 = **27,648,000**

## Expression States

Each body shape has its own Lottie file containing 14 named animation segments. The Lottie face layer animates on top of the static SVG layers, visually overriding the static eye SVG when expressions are active (e.g., `happy` draws squeezed eyes over the resting eye style, `surprised` draws wide eyes). When no expression is playing (or during `idle` blinks), the static eye SVG shows through as the default look. This means eye style affects the character's resting appearance, while Lottie controls expressive moments.

| State | Trigger | Animation | Duration |
|-------|---------|-----------|----------|
| `idle` | Default / no interaction | Gentle breathing, slow blink every 3-5s | Loop |
| `happy` | Likes a video | Big smile, eyes squeeze, slight bounce | 2s → idle |
| `excited` | Subscribes to channel | Eyes wide, mouth open, arms up, body shakes | 2.5s → idle |
| `watching` | During video playback | Eyes fixed forward, occasional small blink | Loop |
| `sleepy` | Screen time warning | Heavy eyelids, yawn, head nod | Loop until dismissed |
| `celebrating` | Badge earned | Jump, sparkle eyes, fist pump | 3s → idle |
| `curious` | Browsing / searching | Head tilt, one eyebrow up, looking around | Loop |
| `waving` | Profile picker greeting | Hand wave, smile | 2s → idle |
| `dancing` | Streak milestone | Rhythmic bounce, arms swing | 3s → idle |
| `laughing` | User-triggered (future) | Eyes squeeze, mouth open, body shakes | 2s → idle |
| `surprised` | New content / notification | Eyes wide, mouth O, slight jump back | 1.5s → idle |
| `thinking` | Loading states | Look up, hand on chin, dots appear | Loop |
| `sad` | Video ends | Slight frown, eyes down | 2s → idle |
| `cheering` | Playlist complete | Both arms up, big grin, confetti eyes | 3s → idle |

### Transition Logic

- Triggered states play once then return to the **context state** (`watching` during playback, `idle` elsewhere)
- New triggers interrupt currently playing expressions
- All transitions use a 200ms crossfade between segments

### Expression Priority

When multiple triggers fire simultaneously, highest priority wins:

`celebrating` > `cheering` > `dancing` > `excited` > `happy` > `surprised` > `laughing` > `sad` > `sleepy` > `curious` > `watching` > `thinking` > `waving` > `idle`

## Lottie File Structure

```
/public/avatars/lottie/expressions/
  body-round.json
  body-tall.json
  body-small.json
  body-wide.json
  body-slim.json
  body-square.json
```

Each JSON contains frame markers: `{ "idle": [0, 120], "happy": [121, 180], ... }`

## Character Builder UI

Replaces the current emoji avatar selector in CreateChildModal. Also accessible via "Edit Avatar" button on profile/account page.

### Layout

```
┌─────────────────────────────────────────────┐
│              Character Builder               │
├──────────────────────┬──────────────────────┤
│                      │                      │
│                      │   Options Grid       │
│   Live Preview       │   (scrollable)       │
│   (character at      │                      │
│    ~200px tall,      │   ○ ○ ○ ○ ○ ○       │
│    centered,         │   ○ ○ ○ ○ ○ ○       │
│    idle animation    │                      │
│    playing)          │                      │
│                      │                      │
├──────────────────────┴──────────────────────┤
│  [Body] [Skin] [Hair] [Eyes] [Outfit] [Acc] │
│         ← category tabs (scrollable) →       │
├─────────────────────────────────────────────┤
│        [🎲 Randomize]      [✓ Done]         │
└─────────────────────────────────────────────┘
```

### Behavior

- **Live preview** updates instantly as kids tap options — character reacts with `happy` expression on each change
- **Category tabs** at the bottom, horizontally scrollable on mobile. Active tab has clay-style raised look
- **Options grid** shows visual thumbnails (mini SVG previews), not text labels. 3 columns on mobile, 4 on tablet+
- **Selected option** has a bouncy scale + colored border highlight
- **Randomize button** picks random options across all categories with a fun spin animation on the character
- **Hair color** appears as a sub-row when Hair tab is active (color circles below the style grid)
- **Outfit color** same pattern — sub-row of color circles when Outfit tab is active
- **Done button** saves the avatar config and closes the builder

### Mobile Responsive

- Small screens: preview on top (40% height), options below (60%)
- Larger screens: side-by-side layout

### Claymorphism Styling

- Builder panel uses `clay-shadow`, thick 3px borders, rounded 24px corners
- Option thumbnails are mini clay cards with hover lift
- Tabs use the same style as BottomTabBar — bubble background on active

## Rendering — `<AnimatedAvatar />`

```tsx
<AnimatedAvatar
  config={avatarConfig}       // AvatarConfig object
  expression="idle"           // current expression state
  size="sm" | "md" | "lg"    // 32px, 64px, 200px
  className?: string
/>
```

### Size Behavior

| Size | Pixels | Lottie | Use Case |
|------|--------|--------|----------|
| `sm` | 32px | None (static SVG only) | Profile dropdown, thumbnail cards, nav |
| `md` | 64px | Full 14 expressions | Profile picker, badges, streak counter, floating companion |
| `lg` | 200px | Full 14 expressions | Character builder, celebration screens, empty states |

### SVG Composition Order

1. Load body shape SVG, apply skin tone as CSS fill
2. Stack outfit SVG, apply outfit color as CSS fill
3. Stack eye style SVG (resting/default look)
4. Overlay Lottie face animation (matched to body shape — draws over eyes during expressions)
5. Stack hair SVG, apply hair color as CSS fill
6. Stack accessory SVG

### Asset Loading

- SVGs are inlined (small, ~1-3KB each)
- Lottie JSONs lazy-loaded only when `lg` size is used
- Lottie player: `lottie-react` package (~15KB gzipped)

## Data Model

### AvatarConfig Interface

```typescript
interface AvatarConfig {
  bodyShape: string    // 'round' | 'tall' | 'small' | 'wide' | 'slim' | 'square'
  skinTone: string     // 'tone-1' through 'tone-8'
  hairStyle: string    // 'short' | 'long' | 'curly' | ... | 'bald'
  hairColor: string    // 'black' | 'brown' | 'blonde' | ...
  eyeStyle: string     // 'round' | 'big' | 'sleepy' | ...
  outfitStyle: string  // 'tshirt' | 'hoodie' | 'dress' | ...
  outfitColor: string  // 'coral' | 'blue' | 'mint' | ...
  accessory: string    // 'none' | 'glasses' | 'hat' | ...
}
```

### Backend Migration

- `ChildProfile.avatar` field changes from `string` to `string | AvatarConfig`
- API accepts both formats, returns whichever is stored
- Existing profiles keep their emoji until the user edits their avatar
- Default avatar for new profiles: randomized AvatarConfig instead of random emoji

### Backward Compatibility

```typescript
function isLegacyAvatar(avatar: string | AvatarConfig): avatar is string {
  return typeof avatar === 'string'
}
// If legacy → render old emoji in a clay circle (current behavior)
// If AvatarConfig → render <AnimatedAvatar />
```

## Floating Companion

A small avatar that lives in the app during use, providing real-time expression feedback.

### Placement & Behavior

- Bottom-left corner (RTL: bottom-right), above BottomTabBar on mobile
- Fixed position, `md` size (64px)
- Gentle `kidtube-float` animation (bob up/down)
- Semi-transparent clay bubble background
- Tapping opens a mini menu: "Edit Avatar", "Switch Profile"
- Draggable — position persists in localStorage under key `kidtube-companion-pos-{childId}` (per-child-profile). Drag bounded to viewport with 16px margin on all edges.
- Collapses to `sm` size (32px) circle after 5s of no interaction, expands on tap
- Hidden during fullscreen video playback
- Respects `prefers-reduced-motion` — static with no float if enabled

## App Integration Points

| Location | Size | Expressions Used |
|----------|------|-----------------|
| Profile picker | lg | `waving` on load, `happy` on select |
| Character builder | lg | `happy` on change, `excited` on randomize |
| Floating companion | md | Context-aware (all 14 states) |
| Profile dropdown | sm | Static only |
| Thumbnail cards | sm | Static only |
| Video player page | md (companion) | `watching`, `sleepy`, `sad` |
| Badge earned overlay | lg | `celebrating` |
| Streak milestone | lg | `dancing` |
| Like button trigger | md (companion) | `happy` |
| Subscribe trigger | md (companion) | `excited` |
| Search / browse | md (companion) | `curious` |
| Loading states | md | `thinking` |
| Playlist complete | lg | `cheering` |
| Empty states | lg | `surprised` |

## File Structure

### New Files

```
site-app/
├── public/avatars/
│   ├── svg/
│   │   ├── body/          (6 files)
│   │   ├── hair/          (12 files)
│   │   ├── eyes/          (6 files)
│   │   ├── outfit/        (10 files)
│   │   └── accessory/     (9 files — "None" has no SVG, handled in code)
│   └── lottie/
│       └── expressions/   (6 files)
├── src/
│   ├── components/
│   │   ├── AnimatedAvatar.tsx
│   │   ├── AvatarBuilder.tsx
│   │   ├── AvatarCompanion.tsx
│   │   └── AvatarExpressionProvider.tsx
│   ├── hooks/
│   │   └── useAvatarExpression.ts
│   └── lib/
│       ├── avatar-config.ts
│       └── avatar-assets.ts
```

### Modified Files

| File | Change |
|------|--------|
| `CreateChildModal.tsx` | Replace emoji selector with `<AvatarBuilder />` |
| `ProfilePicker.tsx` | Replace emoji rendering with `<AnimatedAvatar size="lg" />` |
| `ProfileDropdown.tsx` | Replace emoji/avatar display with `<AnimatedAvatar size="sm" />` |
| `ThumbnailCard.tsx` | Replace channel initial with `<AnimatedAvatar size="sm" />` |
| `BadgeCard.tsx` | Add celebrating expression |
| `StreakCounter.tsx` | Add dancing expression trigger |
| `LikeButton.tsx` | Trigger `happy` expression via context |
| `SubscribeButton.tsx` | Trigger `excited` expression via context |
| `globals.css` | Add avatar-related keyframes and utility classes |
| `layout.tsx` | Wrap app in `<AvatarExpressionProvider />`, add `<AvatarCompanion />` |
| `types.ts` | Add `AvatarConfig` interface, update `ChildProfile` |
| `package.json` | Add `lottie-react` dependency |

## Mascot Migration

The existing `Mascot.tsx` and `MascotBubble.tsx` components are replaced by the new avatar companion system:

- `Mascot.tsx` → replaced by `AnimatedAvatar.tsx` (the avatar now serves as the mascot)
- `MascotBubble.tsx` → replaced by `AvatarCompanion.tsx` (floating companion with mini menu)
- `MascotState` type → replaced by the expression system in `AvatarExpressionProvider.tsx`
- The `kidtube-float` keyframe animation is reused as-is for the companion bob

Both old mascot files should be deleted once the avatar companion is fully integrated.

## Fallback & Error Handling

- **Lottie load failure** (network error, corrupt JSON): Render static SVG layers only, no expression animations. Character appears in resting state with the selected eye style visible.
- **SVG asset missing**: Fall back to a default placeholder SVG (simple colored circle with the child's name initial — matches current legacy behavior).
- **Invalid AvatarConfig values** (e.g., unknown body shape): Fall back to defaults — `bodyShape: 'round'`, `skinTone: 'tone-1'`, `hairStyle: 'short'`, `hairColor: 'brown'`, `eyeStyle: 'round'`, `outfitStyle: 'tshirt'`, `outfitColor: 'coral'`, `accessory: 'none'`.
- **Legacy avatar string**: Render the old emoji in a clay circle (existing behavior preserved via `isLegacyAvatar()` check).

## Dependencies

- `lottie-react` (~15KB gzipped) — Lottie animation player for React

## Accessibility

- All animations respect `prefers-reduced-motion` — static fallback when enabled
- Avatar builder options have aria-labels describing each option
- Floating companion has aria-label and can be dismissed
- Color choices maintain sufficient contrast ratios
