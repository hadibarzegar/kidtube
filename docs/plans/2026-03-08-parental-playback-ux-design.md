# KidTube: Parental Controls, Playback & UI/UX Enhancement Design

**Date:** 2026-03-08
**Approach:** Feature-First (Approach A) — each feature built full-stack, grouped by category
**Order:** Parental Controls → Playback & Viewing → UI/UX & Engagement

---

## Section 1: Parental Controls & Safety

### 1.1 Bedtime Lockout Scheduling
- **Model:** `BedtimeRule` — `user_id`, `child_id`, `start_time` (e.g. "21:00"), `end_time` (e.g. "07:00"), `timezone`, `enabled`
- **Backend:** `SetBedtime`, `GetBedtime`, `DeleteBedtime` at `/me/children/{childId}/bedtime`
- **Frontend:** Time picker section in ParentalControlsClient with toggle
- **Enforcement:** Client-side check on app load + ScreenTimeTimer checks bedtime window. Shows TimeLockOverlay with bedtime message

### 1.2 Block Specific Episodes
- **Model:** `EpisodeRule` — `user_id`, `child_id`, `episode_id`, `action: "block"`
- **Backend:** `BlockEpisode`, `UnblockEpisode`, `ListBlockedEpisodes` at `/me/children/{childId}/blocked-episodes`
- **Frontend:** "Block" button on WatchClient (parent mode), blocked list in parental controls
- **Enforcement:** Discovery/browse endpoints filter out blocked episode IDs for active child

### 1.3 Kid-Proof Exit Challenge
- Spelled-out number challenge (like Disney+): show 4 Persian number words, child types digits
- `KidProofChallenge` client component generates random challenges
- Gates access to PIN modal for child profile exit only
- No backend changes — purely client-side

### 1.4 Pause Watch/Search History
- Add `watch_history_paused`, `search_history_paused` booleans to `ChildProfile`
- `UpdateChild` handler already supports partial updates — add new fields
- When paused, `UpdateWatchProgress` and `ReportScreenTime` skip recording
- Two toggles in ParentalControlsClient under "حریم خصوصی" section

### 1.5 Per-Child Passcodes
- Add `passcode` (bcrypt hash) to `ChildProfile`
- **Backend:** `SetChildPasscode`, `VerifyChildPasscode` handlers
- **Frontend:** ProfilePicker shows 4-digit input when switching to child with passcode
- Parent can set/remove per-child passcode in parental controls

### 1.6 Content Rating Enforcement
- Discovery/browse handlers accept `max_maturity` query param
- Frontend includes `?max_maturity={level}` when active child has maturity level set
- Episodes with higher ratings filtered server-side

---

## Section 2: Playback & Viewing

### 2.1 Skip Intro / Skip Recap Buttons
- Add `intro_end_sec`, `recap_end_sec` optional fields to `Episode` model
- Admin UI: number inputs on episode edit form
- Frontend: VideoPlayer shows floating "رد کردن" button during intro/recap window
- Button auto-hides after window passes

### 2.2 Voice Search
- Browser Web Speech API (`SpeechRecognition`), language `fa-IR`
- `VoiceSearchButton` component: mic icon, animated indicator, fills search input
- Placed in TopBar search and mobile SearchOverlay
- Graceful fallback: hide if browser doesn't support API

### 2.3 Rewind / Forward ±10s Buttons
- Overlay buttons on VideoPlayer: -10s and +10s
- Double-tap gesture on mobile (left half = -10s, right half = +10s) with ripple animation
- No backend changes

### 2.4 Picture-in-Picture Mode
- Enable PiP (currently disabled with `pictureInPictureToggle: false`)
- PiP toggle button in player controls
- Standard `requestPictureInPicture()` browser API

### 2.5 Caption Customization
- `CaptionSettings` component: font size, background opacity, text color
- Persist in localStorage `caption_prefs`
- Apply via Video.js `textTrackSettings` API

---

## Section 3: UI/UX & Engagement

### 3.1 Gamification (Badges, Streaks, Rewards)
- **Models:** `Achievement` (badge_type, earned_at), `Streak` (current_streak, longest_streak, last_watch_date)
- **Badge types:** first_video, streak_3/7/30, watched_10/50/100, explorer (5 categories), bookworm (5 educational)
- **Backend:** `GetBadges`, `GetStreak` handlers; auto-awarded server-side on qualifying events
- **Frontend:** `BadgeCard`, `StreakCounter` components; badges grid on profile page, streak on homepage

### 3.2 Animated Mascot ("توتو" the Owl)
- SVG/CSS animated character appearing in empty states, onboarding, time lock, badge earned
- `MascotBubble` component: mascot + speech bubble with contextual Persian text
- States: waving, sleeping, celebrating, pointing
- No backend — static assets + CSS animations

### 3.3 Expanded Avatar System (8 → 24)
- 4 categories: Animals (8), Space (4), Nature (4), Fun (8)
- Update `CreateChildModal` and `ProfilePicker` with categorized grid
- No backend changes — emoji strings

### 3.4 Sound Effects & Audio Cues
- `useSoundEffects` hook plays clips: button tap, badge earned, profile switch, countdown, challenge success
- Small mp3 files in `/public/sounds/`
- `SoundProvider` context, toggle in settings (localStorage), default ON for children

### 3.5 Dark Mode Auto-Detect
- `ThemeProvider` checks `prefers-color-scheme` on first load
- Auto-apply if no manual selection; respect explicit choice
- `MediaQueryList` change listener for real-time OS theme switches

### 3.6 Onboarding Feature Discovery Tooltips
- `FeatureTooltip` component: pulsing ring highlight + mascot bubble
- `useOnboardingTour` hook tracks dismissed tooltips (localStorage)
- Tour: search → sidebar → profiles → bookmarks → parental controls
- "بعدی" (Next) and "رد کردن" (Skip) buttons; shows once per account

---

## Implementation Order

| Phase | Category | Features |
|-------|----------|----------|
| 1 | Parental Controls | 1.1 Bedtime Lockout, 1.2 Episode Blocking, 1.3 Kid-Proof Exit |
| 2 | Parental Controls | 1.4 Pause History, 1.5 Per-Child Passcodes, 1.6 Rating Enforcement |
| 3 | Playback | 2.1 Skip Intro, 2.2 Voice Search, 2.3 ±10s Buttons |
| 4 | Playback | 2.4 PiP, 2.5 Caption Customization |
| 5 | UI/UX | 3.1 Gamification, 3.2 Mascot |
| 6 | UI/UX | 3.3 Avatars, 3.4 Sounds, 3.5 Auto-Detect Theme, 3.6 Tooltips |

## Technical Conventions
- **Backend:** Go + Chi + MongoDB, closure-based handler pattern, `userIDFromContext(r)` for auth
- **Frontend:** Next.js App Router, Tailwind CSS, RTL Persian, clay design system
- **Auth:** JWT via cookies (`site_token`), `authFetch`/`apiServerAuthFetch` wrappers
- **Child profiles:** Embedded subdocs in User (max 5), not separate collection
- **New collections:** `bedtime_rules`, `episode_rules`, `achievements`, `streaks`
