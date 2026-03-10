# Video Player Upgrade Design

## Features

### Group 1: Gesture & Interaction
- Long-press 2x speed (hold to speed up, release to normal)
- Vertical swipe brightness (left half) / volume (right half) on mobile

### Group 2: Seek Bar
- Preview thumbnails on seek bar hover
- Pill-shaped control grouping (YouTube 2025 style)

### Group 3: Player Modes
- Theater mode (full-width, dark surround)
- In-app mini-player (floating player while browsing)
- Ambient mode (background glows with video colors)

### Group 4: Kid-Safety
- Simplified kid-mode controls (hide advanced, enlarge targets)
- Sound effects on tap for kids

### Group 5: Polish
- Volume normalization
- Sleep timer in player

## Technical Approach
- Build into existing VideoPlayer.tsx and WatchClient.tsx
- CSS + JS overlays, minimal new dependencies
- Canvas color extraction for ambient mode
- React context for mini-player persistence
- Kid-mode reads active profile from auth context
