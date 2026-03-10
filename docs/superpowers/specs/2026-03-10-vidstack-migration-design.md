# Video Player Migration: Video.js to Vidstack

## Goal

Replace Video.js 8.x with Vidstack Player to gain built-in HLS quality menu, native React hooks, i18n support, and a smaller bundle — while preserving all existing features and Persian language support.

## Current State

- **Player:** Video.js 8.23.7 + `videojs-contrib-quality-menu` plugin
- **Persian support:** Manual `videojs.addLanguage('fa')`, MutationObserver for digit conversion on DOM text nodes, custom translations
- **Custom features:** Double-tap seek, long-press 2x speed, vertical swipe volume/brightness, skip intro/recap, theater mode, kid mode, sleep timer, caption settings, ambient color extraction, progress reporting

### Files involved

| File | Role |
|---|---|
| `site-app/src/components/VideoPlayer.tsx` | Main player component (510 lines) |
| `site-app/src/components/VideoPlayerWrapper.tsx` | Dynamic import wrapper (SSR bypass) |
| `site-app/src/app/globals.css` | ~120 lines of `.vjs-*` custom CSS |
| `site-app/src/hooks/useAmbientColor.ts` | Canvas color extraction using `.video-js video` selector |
| `site-app/src/app/watch/[id]/WatchClient.tsx` | Parent page, passes props, uses `.video-js video` selector |
| `site-app/src/types/videojs-contrib-quality-menu.d.ts` | Type declaration for plugin |
| `site-app/src/components/SleepTimer.tsx` | Standalone, no Video.js dependency |
| `site-app/src/components/CaptionSettings.tsx` | Standalone, connects via localStorage events |
| `site-app/src/components/SoundProvider.tsx` | Standalone, no Video.js dependency |

## Architecture

Use Vidstack's `DefaultVideoLayout` with the `translations` prop for Persian, CSS variable overrides for styling, and custom slots for overlay features.

```tsx
<MediaPlayer src={hlsSrc} onEnded={onEnded}>
  <MediaProvider />
  <Track src={subtitleSrc} kind="subtitles" label="فارسی" lang="fa" default />
  <DefaultVideoLayout
    translations={persianTranslations}
    icons={defaultLayoutIcons}
    slots={{
      beforeFullscreenButton: <TheaterModeButton />,
    }}
  />
  {/* Custom overlays rendered as siblings inside MediaPlayer */}
  <PlayerOverlays />   {/* skip intro/recap, gestures, indicators */}
</MediaPlayer>
```

## Feature Mapping

### Built-in (no custom code needed)

| Feature | Video.js approach | Vidstack approach |
|---|---|---|
| HLS playback | `sources: [{type: 'application/x-mpegURL'}]` | `src={hlsSrc}` (auto-detected) |
| Quality menu | 2-3 plugins | Built-in DefaultVideoLayout |
| Playback rate menu | `playbackRateMenuButton` config | Built-in settings menu |
| Seek forward/backward buttons | Custom overlay buttons | Built-in in layout |
| Fullscreen | Built-in | Built-in |
| PiP | Built-in | Built-in |
| Keyboard shortcuts | Partial | Built-in |
| Gestures (double-tap seek) | Custom touch handlers | Built-in gesture system |

### Custom code (migrated)

| Feature | Migration approach |
|---|---|
| Persian i18n | `translations` prop on DefaultVideoLayout |
| Persian digit conversion | Use `useMediaState` hooks to read time values, render Persian digits in custom React components — no MutationObserver needed |
| Captions/subtitles | `<Track>` component as child of `<MediaPlayer>` |
| Caption settings | Same CaptionSettings component, apply styles via Vidstack's caption CSS variables |
| Skip intro/recap | Overlay buttons, use `useMediaState` for `currentTime` instead of `player.on('timeupdate')` |
| Long-press 2x speed | Keep custom touch handlers on wrapper div |
| Vertical swipe vol/brightness | Keep custom touch handlers on wrapper div |
| Theater mode | Custom button via `slots.beforeFullscreenButton` |
| Kid mode | Conditional slots (hide PiP, settings) + CSS class for enlarged targets |
| Sleep timer | Keep as overlay button, pause via `useMediaPlayer().pause()` |
| Ambient color | Update selector from `.video-js video` to `[data-media-player] video` |
| Progress reporting | `useMediaState` for currentTime/duration with throttled callback |

### Unchanged files

- `SleepTimer.tsx` — standalone, receives `onSleep` callback
- `CaptionSettings.tsx` — standalone, uses localStorage + custom event
- `SoundProvider.tsx` — standalone context provider
- `CountdownOverlay.tsx` — standalone overlay component

## Persian Translations

```typescript
const persianTranslations: Partial<DefaultLayoutTranslations> = {
  'Play': 'پخش',
  'Pause': 'توقف',
  'Mute': 'بی‌صدا',
  'Unmute': 'صدادار',
  'Enter Fullscreen': 'تمام‌صفحه',
  'Exit Fullscreen': 'خروج از تمام‌صفحه',
  'Enter PiP': 'تصویر در تصویر',
  'Exit PiP': 'خروج از تصویر در تصویر',
  'Seek Forward': 'جلو',
  'Seek Backward': 'عقب',
  'Volume': 'صدا',
  'Speed': 'سرعت',
  'Normal': 'عادی',
  'Quality': 'کیفیت',
  'Auto': 'خودکار',
  'Captions': 'زیرنویس',
  'Closed-Captions On': 'زیرنویس روشن',
  'Closed-Captions Off': 'زیرنویس خاموش',
  'Settings': 'تنظیمات',
  'Replay': 'پخش مجدد',
  'Accessibility': 'دسترسی‌پذیری',
  'Audio': 'صدا',
  'Loop': 'تکرار',
  'Default': 'پیش‌فرض',
  'Chapters': 'فصل‌ها',
  // Complete list finalized after install from TypeScript types
}
```

## Kid Mode

```tsx
<DefaultVideoLayout
  translations={persianTranslations}
  icons={defaultLayoutIcons}
  slots={{
    pipButton: isKidMode ? null : undefined,
    settingsMenu: isKidMode ? null : undefined,
    beforeFullscreenButton: !isKidMode ? <TheaterModeButton /> : null,
  }}
/>
```

Plus a CSS class on the wrapper for enlarged touch targets and playful styling.

## CSS Changes

Remove all `~120 lines` of `.video-js` / `.vjs-*` CSS from globals.css. Replace with Vidstack CSS variable overrides:

```css
[data-media-player] {
  --media-brand: var(--color-primary);
  --media-focus-ring-color: var(--color-primary);
  --media-font-family: inherit;
  /* Additional overrides as needed */
}

/* Kid mode overrides */
.kid-mode-player [data-media-player] {
  --media-controls-size: 48px;
  /* Enlarged targets */
}
```

## Dependency Changes

**Remove:**
- `video.js`
- `videojs-contrib-quality-menu`

**Add:**
- `@vidstack/react`

**Delete:**
- `site-app/src/types/videojs-contrib-quality-menu.d.ts`

## Migration Steps

1. Install `@vidstack/react`, remove Video.js packages
2. Rewrite `VideoPlayer.tsx` with Vidstack components
3. Update `VideoPlayerWrapper.tsx` dynamic import
4. Replace Video.js CSS in `globals.css` with Vidstack overrides
5. Update ambient color selector in `useAmbientColor.ts` and `WatchClient.tsx`
6. Delete `videojs-contrib-quality-menu.d.ts`
7. Connect `CaptionSettings` to Vidstack's caption styling API
8. Test all features: HLS, quality menu, Persian translations, gestures, kid mode, theater mode, captions, skip intro/recap, sleep timer, ambient mode, progress reporting
