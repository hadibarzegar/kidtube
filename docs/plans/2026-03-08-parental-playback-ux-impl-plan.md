# Parental Controls, Playback & UI/UX Enhancement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 16 features across parental controls (bedtime, episode blocking, kid-proof exit, pause history, child passcodes, rating enforcement), playback (skip intro, voice search, ±10s, PiP, caption customization), and UI/UX (gamification, mascot, avatars, sounds, auto-detect theme, onboarding tooltips).

**Architecture:** Feature-first approach — each feature built full-stack (model → handler → frontend → integration). Backend uses Go/Chi/MongoDB with closure-based handlers. Frontend uses Next.js App Router with Tailwind CSS, RTL Persian layout, clay design system.

**Tech Stack:** Go, Chi router, MongoDB (mongo-driver v2), Next.js 16, Tailwind CSS, Video.js, Web Speech API

---

## Phase 1: Parental Controls — Part A

### Task 1: Bedtime Lockout — Backend Model & Handler

**Files:**
- Create: `backend/internal/models/bedtime_rule.go`
- Create: `backend/internal/handler/site_bedtime.go`
- Modify: `backend/internal/db/mongo.go` (add collection + index)
- Modify: `backend/cmd/site-api/main.go` (add routes)

**Step 1: Create BedtimeRule model**

Create `backend/internal/models/bedtime_rule.go`:
```go
package models

import (
	"time"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BedtimeRule struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	StartTime string        `bson:"start_time" json:"start_time"` // "21:00" (24h format)
	EndTime   string        `bson:"end_time" json:"end_time"`     // "07:00"
	Timezone  string        `bson:"timezone" json:"timezone"`     // "Asia/Tehran"
	Enabled   bool          `bson:"enabled" json:"enabled"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updated_at"`
}
```

**Step 2: Add collection constant and index in `backend/internal/db/mongo.go`**

Add to collection constants block:
```go
CollBedtimeRules = "bedtime_rules"
```

Add to `EnsureIndexes` function before the return statement:
```go
// Bedtime rules: one rule per child
bedtimeRulesIndexes := mongo.IndexModel{
	Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}},
	Options: options.Index().SetUnique(true),
}
if _, err := database.Collection(CollBedtimeRules).Indexes().CreateOne(ctx, bedtimeRulesIndexes); err != nil {
	return err
}
```

**Step 3: Create bedtime handlers**

Create `backend/internal/handler/site_bedtime.go`:
```go
package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"kidtube/internal/db"
	"kidtube/internal/models"
)

type setBedtimeRequest struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Timezone  string `json:"timezone"`
	Enabled   bool   `json:"enabled"`
}

func SetBedtime(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := userIDFromContext(r)
		if userID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		uid, err := bson.ObjectIDFromHex(userID)
		if err != nil {
			http.Error(w, "invalid user id", http.StatusBadRequest)
			return
		}
		childIDStr := chi.URLParam(r, "childId")
		childID, err := bson.ObjectIDFromHex(childIDStr)
		if err != nil {
			http.Error(w, "invalid child id", http.StatusBadRequest)
			return
		}

		var req setBedtimeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if req.StartTime == "" || req.EndTime == "" {
			http.Error(w, "start_time and end_time are required", http.StatusBadRequest)
			return
		}
		if req.Timezone == "" {
			req.Timezone = "Asia/Tehran"
		}
		// Validate timezone
		if _, err := time.LoadLocation(req.Timezone); err != nil {
			http.Error(w, "invalid timezone", http.StatusBadRequest)
			return
		}

		now := time.Now().UTC()
		coll := database.Collection(db.CollBedtimeRules)
		filter := bson.D{{Key: "user_id", Value: uid}, {Key: "child_id", Value: childID}}
		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "start_time", Value: req.StartTime},
				{Key: "end_time", Value: req.EndTime},
				{Key: "timezone", Value: req.Timezone},
				{Key: "enabled", Value: req.Enabled},
				{Key: "updated_at", Value: now},
			}},
			{Key: "$setOnInsert", Value: bson.D{
				{Key: "user_id", Value: uid},
				{Key: "child_id", Value: childID},
				{Key: "created_at", Value: now},
			}},
		}
		opts := options.UpdateOne().SetUpsert(true)
		if _, err := coll.UpdateOne(r.Context(), filter, update, opts); err != nil {
			http.Error(w, "failed to save bedtime rule", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}
}

func GetBedtime(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := userIDFromContext(r)
		if userID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		uid, _ := bson.ObjectIDFromHex(userID)
		childIDStr := chi.URLParam(r, "childId")
		childID, err := bson.ObjectIDFromHex(childIDStr)
		if err != nil {
			http.Error(w, "invalid child id", http.StatusBadRequest)
			return
		}

		coll := database.Collection(db.CollBedtimeRules)
		var rule models.BedtimeRule
		err = coll.FindOne(r.Context(), bson.D{
			{Key: "user_id", Value: uid},
			{Key: "child_id", Value: childID},
		}).Decode(&rule)
		if err != nil {
			// No rule set — return defaults
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{
				"enabled":    false,
				"start_time": "",
				"end_time":   "",
				"timezone":   "Asia/Tehran",
				"is_bedtime": false,
			})
			return
		}

		// Check if currently in bedtime window
		isBedtime := checkBedtime(rule)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"id":         rule.ID.Hex(),
			"enabled":    rule.Enabled,
			"start_time": rule.StartTime,
			"end_time":   rule.EndTime,
			"timezone":   rule.Timezone,
			"is_bedtime": isBedtime,
		})
	}
}

func DeleteBedtime(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := userIDFromContext(r)
		if userID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		uid, _ := bson.ObjectIDFromHex(userID)
		childIDStr := chi.URLParam(r, "childId")
		childID, err := bson.ObjectIDFromHex(childIDStr)
		if err != nil {
			http.Error(w, "invalid child id", http.StatusBadRequest)
			return
		}

		coll := database.Collection(db.CollBedtimeRules)
		coll.DeleteOne(r.Context(), bson.D{
			{Key: "user_id", Value: uid},
			{Key: "child_id", Value: childID},
		})
		w.WriteHeader(http.StatusNoContent)
	}
}

// checkBedtime returns true if current time falls within the bedtime window
func checkBedtime(rule models.BedtimeRule) bool {
	if !rule.Enabled {
		return false
	}
	loc, err := time.LoadLocation(rule.Timezone)
	if err != nil {
		return false
	}
	now := time.Now().In(loc)
	nowMinutes := now.Hour()*60 + now.Minute()

	startParts := parseTime(rule.StartTime)
	endParts := parseTime(rule.EndTime)
	startMin := startParts[0]*60 + startParts[1]
	endMin := endParts[0]*60 + endParts[1]

	if startMin > endMin {
		// Overnight: e.g. 21:00 to 07:00
		return nowMinutes >= startMin || nowMinutes < endMin
	}
	// Same day: e.g. 13:00 to 15:00
	return nowMinutes >= startMin && nowMinutes < endMin
}

func parseTime(t string) [2]int {
	var h, m int
	for i, c := range t {
		if c == ':' {
			for _, d := range t[:i] {
				h = h*10 + int(d-'0')
			}
			for _, d := range t[i+1:] {
				m = m*10 + int(d-'0')
			}
			break
		}
	}
	return [2]int{h, m}
}
```

**Step 4: Register routes in `backend/cmd/site-api/main.go`**

Add in the protected routes group (after children routes):
```go
// Bedtime rules
r.Put("/me/children/{childId}/bedtime", handler.SetBedtime(database))
r.Get("/me/children/{childId}/bedtime", handler.GetBedtime(database))
r.Delete("/me/children/{childId}/bedtime", handler.DeleteBedtime(database))
```

**Step 5: Verify backend compiles**

Run: `cd backend && go build ./...`
Expected: No errors

**Step 6: Commit**

```bash
git add backend/internal/models/bedtime_rule.go backend/internal/handler/site_bedtime.go backend/internal/db/mongo.go backend/cmd/site-api/main.go
git commit -m "feat: add bedtime lockout scheduling backend (model, handler, routes)"
```

---

### Task 2: Bedtime Lockout — Frontend

**Files:**
- Modify: `site-app/src/components/ParentalControlsClient.tsx` (add bedtime section)
- Modify: `site-app/src/components/ScreenTimeTimer.tsx` (add bedtime check)
- Modify: `site-app/src/lib/types.ts` (add BedtimeRule type)

**Step 1: Add BedtimeRule type to `site-app/src/lib/types.ts`**

Add after ScreenTimeInfo interface:
```typescript
export interface BedtimeRule {
  enabled: boolean
  start_time: string
  end_time: string
  timezone: string
  is_bedtime: boolean
}
```

**Step 2: Add bedtime section to ParentalControlsClient**

Add after the autoplay toggle section — a new "ساعت خواب" (Bedtime) section with:
- Enable/disable toggle
- Start time input (type="time")
- End time input (type="time")
- Save button that calls `PUT /me/children/{childId}/bedtime`
- Load current bedtime on mount via `GET /me/children/{childId}/bedtime`

**Step 3: Modify ScreenTimeTimer to check bedtime**

In the `fetchScreenTime` callback, also fetch bedtime status:
```typescript
const bedtimeRes = await authFetch(`/me/children/${childId}/bedtime`)
if (bedtimeRes.ok) {
  const bedtime = await bedtimeRes.json()
  if (bedtime.is_bedtime) {
    setTimeExpired(true) // Reuse TimeLockOverlay
    return
  }
}
```

**Step 4: Verify frontend builds**

Run: `cd site-app && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add site-app/src/lib/types.ts site-app/src/components/ParentalControlsClient.tsx site-app/src/components/ScreenTimeTimer.tsx
git commit -m "feat: add bedtime lockout UI and enforcement in screen time timer"
```

---

### Task 3: Episode Blocking — Backend

**Files:**
- Create: `backend/internal/models/episode_rule.go`
- Create: `backend/internal/handler/site_episode_block.go`
- Modify: `backend/internal/db/mongo.go` (add collection + index)
- Modify: `backend/cmd/site-api/main.go` (add routes)

**Step 1: Create EpisodeRule model**

Create `backend/internal/models/episode_rule.go`:
```go
package models

import (
	"time"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type EpisodeRule struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	EpisodeID bson.ObjectID `bson:"episode_id" json:"episode_id"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
```

**Step 2: Add collection and index in `backend/internal/db/mongo.go`**

Add constant: `CollEpisodeRules = "episode_rules"`

Add index:
```go
episodeRulesIndexes := mongo.IndexModel{
	Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "episode_id", Value: 1}},
	Options: options.Index().SetUnique(true),
}
if _, err := database.Collection(CollEpisodeRules).Indexes().CreateOne(ctx, episodeRulesIndexes); err != nil {
	return err
}
```

**Step 3: Create episode block handlers**

Create `backend/internal/handler/site_episode_block.go` with 3 handlers:
- `BlockEpisode(database)` — POST `/me/children/{childId}/blocked-episodes` with `{episode_id}` body. Insert with duplicate key check → 409.
- `UnblockEpisode(database)` — DELETE `/me/children/{childId}/blocked-episodes/{episodeId}`. DeleteOne by filter.
- `ListBlockedEpisodes(database)` — GET `/me/children/{childId}/blocked-episodes`. Find all, enrich with episode title/thumbnail via lookup.

Follow exact same patterns as `site_parental.go` handlers (validate userID, childID, parse from chi params).

**Step 4: Register routes**

Add to protected routes in `backend/cmd/site-api/main.go`:
```go
// Episode blocking
r.Post("/me/children/{childId}/blocked-episodes", handler.BlockEpisode(database))
r.Delete("/me/children/{childId}/blocked-episodes/{episodeId}", handler.UnblockEpisode(database))
r.Get("/me/children/{childId}/blocked-episodes", handler.ListBlockedEpisodes(database))
```

**Step 5: Verify backend compiles**

Run: `cd backend && go build ./...`

**Step 6: Commit**

```bash
git add backend/internal/models/episode_rule.go backend/internal/handler/site_episode_block.go backend/internal/db/mongo.go backend/cmd/site-api/main.go
git commit -m "feat: add episode blocking backend (model, handler, routes)"
```

---

### Task 4: Episode Blocking — Frontend

**Files:**
- Create: `site-app/src/components/BlockEpisodeButton.tsx`
- Modify: `site-app/src/app/watch/[id]/WatchClient.tsx` (add block button)
- Modify: `site-app/src/components/ParentalControlsClient.tsx` (add blocked episodes list)

**Step 1: Create BlockEpisodeButton component**

Create `site-app/src/components/BlockEpisodeButton.tsx`:
- Props: `episodeId: string`, `childId: string | null`
- Only renders when `childId` is set (active child profile)
- Button with block icon (circle with line through)
- On click: POST to `/me/children/{childId}/blocked-episodes` with `{episode_id}`
- Shows confirmation dialog first: "این ویدیو مسدود شود؟"
- After blocking, redirects to home page

**Step 2: Add block button to WatchClient**

In the action buttons area of WatchClient (after ReportButton), add:
```tsx
{activeChildId && (
  <BlockEpisodeButton episodeId={episode.id} childId={activeChildId} />
)}
```
Pass `activeChildId` as a new prop to WatchClient (fetched from user data in the server component).

**Step 3: Add blocked episodes list to ParentalControlsClient**

After channel rules section, add a "ویدیوهای مسدود شده" (Blocked Videos) section:
- Fetch blocked list from GET `/me/children/{childId}/blocked-episodes`
- Display as list with episode title, thumbnail, and unblock button
- Unblock calls DELETE endpoint

**Step 4: Verify frontend builds**

Run: `cd site-app && npm run build`

**Step 5: Commit**

```bash
git add site-app/src/components/BlockEpisodeButton.tsx site-app/src/app/watch/[id]/WatchClient.tsx site-app/src/components/ParentalControlsClient.tsx
git commit -m "feat: add episode blocking UI (block button, blocked list, unblock)"
```

---

### Task 5: Kid-Proof Exit Challenge

**Files:**
- Create: `site-app/src/components/KidProofChallenge.tsx`
- Modify: `site-app/src/components/ProfilePicker.tsx` (gate parent mode exit)

**Step 1: Create KidProofChallenge component**

Create `site-app/src/components/KidProofChallenge.tsx`:
```typescript
'use client'
// Props: onSuccess: () => void, onCancel: () => void
// Generates 4 random digits 0-9
// Displays them as Persian word equivalents: صفر، یک، دو، سه، چهار، پنج، شش، هفت، هشت، نه
// Child must type the 4 digits in order
// On correct input → call onSuccess()
// On cancel → call onCancel()
// UI: clay-card modal overlay, large Persian text for number words, 4 digit input boxes
```

Persian number words map:
```typescript
const PERSIAN_NUMBERS: Record<number, string> = {
  0: 'صفر', 1: 'یک', 2: 'دو', 3: 'سه', 4: 'چهار',
  5: 'پنج', 6: 'شش', 7: 'هفت', 8: 'هشت', 9: 'نه',
}
```

**Step 2: Integrate into ProfilePicker**

In ProfilePicker's `handleParentMode` function, instead of immediately showing PinModal:
1. First show KidProofChallenge
2. On challenge success → then show PinModal
3. On challenge cancel → close

Add state: `showChallenge: boolean`

**Step 3: Verify frontend builds**

Run: `cd site-app && npm run build`

**Step 4: Commit**

```bash
git add site-app/src/components/KidProofChallenge.tsx site-app/src/components/ProfilePicker.tsx
git commit -m "feat: add kid-proof exit challenge before parent PIN entry"
```

---

## Phase 2: Parental Controls — Part B

### Task 6: Pause Watch/Search History — Backend

**Files:**
- Modify: `backend/internal/models/user.go` (add fields to ChildProfile)
- Modify: `backend/internal/handler/site_children.go` (UpdateChild handles new fields)
- Modify: `backend/internal/handler/site_watch_progress.go` (check pause flag)

**Step 1: Add fields to ChildProfile in `backend/internal/models/user.go`**

Add before CreatedAt:
```go
WatchHistoryPaused  bool `bson:"watch_history_paused" json:"watch_history_paused"`
SearchHistoryPaused bool `bson:"search_history_paused" json:"search_history_paused"`
```

**Step 2: Update UpdateChild handler's request struct and update logic**

In `site_children.go`, add to `updateChildRequest`:
```go
WatchHistoryPaused  *bool `json:"watch_history_paused"`
SearchHistoryPaused *bool `json:"search_history_paused"`
```
Add corresponding `$set` fields in the update document when non-nil.

**Step 3: Add pause check in UpdateWatchProgress**

In `site_watch_progress.go`, after extracting userID and childID, before saving progress:
```go
// Check if watch history is paused for this child
if childIDStr != "" {
	var user models.User
	childOID, _ := bson.ObjectIDFromHex(childIDStr)
	err := database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{
		{Key: "_id", Value: uid},
		{Key: "child_profiles._id", Value: childOID},
	}).Decode(&user)
	if err == nil {
		for _, cp := range user.ChildProfiles {
			if cp.ID == childOID && cp.WatchHistoryPaused {
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(map[string]string{"status": "paused"})
				return
			}
		}
	}
}
```

**Step 4: Verify backend compiles**

Run: `cd backend && go build ./...`

**Step 5: Commit**

```bash
git add backend/internal/models/user.go backend/internal/handler/site_children.go backend/internal/handler/site_watch_progress.go
git commit -m "feat: add pause watch/search history support in backend"
```

---

### Task 7: Pause Watch/Search History — Frontend

**Files:**
- Modify: `site-app/src/lib/types.ts` (add fields to ChildProfile)
- Modify: `site-app/src/components/ParentalControlsClient.tsx` (add toggles)

**Step 1: Update ChildProfile type**

Add to ChildProfile interface:
```typescript
watch_history_paused: boolean
search_history_paused: boolean
```

**Step 2: Add toggles in ParentalControlsClient**

After autoplay toggle, add a "حریم خصوصی" (Privacy) header with two toggles:
- "توقف ذخیره تاریخچه تماشا" (Pause watch history) → updates `watch_history_paused`
- "توقف ذخیره تاریخچه جستجو" (Pause search history) → updates `search_history_paused`

Use same toggle pattern as existing toggles (PUT to `/me/children/{childId}` with the field).

**Step 3: Verify frontend builds**

Run: `cd site-app && npm run build`

**Step 4: Commit**

```bash
git add site-app/src/lib/types.ts site-app/src/components/ParentalControlsClient.tsx
git commit -m "feat: add pause history toggles in parental controls UI"
```

---

### Task 8: Per-Child Passcodes

**Files:**
- Modify: `backend/internal/models/user.go` (add Passcode field)
- Create: `backend/internal/handler/site_child_passcode.go`
- Modify: `backend/cmd/site-api/main.go` (add routes)
- Create: `site-app/src/components/ChildPasscodeModal.tsx`
- Modify: `site-app/src/components/ProfilePicker.tsx` (gate with passcode)
- Modify: `site-app/src/components/ParentalControlsClient.tsx` (set passcode UI)

**Step 1: Add Passcode to ChildProfile model**

In `backend/internal/models/user.go`, add to ChildProfile:
```go
Passcode string `bson:"passcode,omitempty" json:"-"` // bcrypt hash, never sent to client
HasPasscode bool `bson:"has_passcode" json:"has_passcode"`
```

**Step 2: Create passcode handlers**

Create `backend/internal/handler/site_child_passcode.go`:
- `SetChildPasscode(database)` — POST `/me/children/{childId}/passcode` with `{passcode}` (4 digits). Bcrypt hash, update with array filter. Also set `has_passcode: true`.
- `VerifyChildPasscode(database)` — POST `/me/children/{childId}/verify-passcode` with `{passcode}`. Compare bcrypt. Return 200 or 401.
- `RemoveChildPasscode(database)` — DELETE `/me/children/{childId}/passcode`. Clear passcode field, set `has_passcode: false`.

**Step 3: Register routes**

```go
r.Post("/me/children/{childId}/passcode", handler.SetChildPasscode(database))
r.Post("/me/children/{childId}/verify-passcode", handler.VerifyChildPasscode(database))
r.Delete("/me/children/{childId}/passcode", handler.RemoveChildPasscode(database))
```

**Step 4: Create ChildPasscodeModal frontend component**

`site-app/src/components/ChildPasscodeModal.tsx`:
- Props: `childId: string`, `onSuccess: () => void`, `onCancel: () => void`
- 4-digit PIN input (same pattern as PinModal)
- Calls POST `/me/children/{childId}/verify-passcode`
- On success → calls onSuccess

**Step 5: Integrate into ProfilePicker**

When activating a child profile, check if `child.has_passcode` is true:
- If yes → show ChildPasscodeModal first → on success → activate
- If no → activate directly (current behavior)

**Step 6: Add passcode management in ParentalControlsClient**

New section "رمز پروفایل" (Profile Passcode):
- If passcode set: show "تغییر رمز" and "حذف رمز" buttons
- If not set: show "تنظیم رمز" button with 4-digit input

**Step 7: Verify both backend and frontend build**

Run: `cd backend && go build ./...`
Run: `cd site-app && npm run build`

**Step 8: Commit**

```bash
git add backend/internal/models/user.go backend/internal/handler/site_child_passcode.go backend/cmd/site-api/main.go site-app/src/components/ChildPasscodeModal.tsx site-app/src/components/ProfilePicker.tsx site-app/src/components/ParentalControlsClient.tsx
git commit -m "feat: add per-child passcode protection for profile switching"
```

---

### Task 9: Content Rating Enforcement

**Files:**
- Modify: `backend/internal/handler/site_discover.go` (add max_maturity filter)
- Modify: `site-app/src/app/page.tsx` (pass maturity param)
- Modify: `site-app/src/app/browse/page.tsx` (pass maturity param)
- Modify: `site-app/src/app/search/page.tsx` (pass maturity param)

**Step 1: Add maturity filtering to discovery handlers**

In `site_discover.go`, for each handler (GetTrending, GetNewEpisodes, GetPopularInCategory, GetRelatedEpisodes, GetPersonalized), add:
```go
maxMaturity := r.URL.Query().Get("max_maturity")
if maxMaturity != "" {
	allowed := maturityAllowed(maxMaturity)
	filter = append(filter, bson.E{Key: "maturity_rating", Value: bson.D{{Key: "$in", Value: allowed}}})
}
```

Add helper function:
```go
func maturityAllowed(max string) []string {
	levels := []string{"all-ages", "6+", "9+", "12+"}
	var allowed []string
	for _, l := range levels {
		allowed = append(allowed, l)
		if l == max {
			break
		}
	}
	return allowed
}
```

**Step 2: Frontend — pass maturity param in content fetch calls**

In page.tsx, browse/page.tsx, search/page.tsx: when there's an active child profile with a maturity level, append `?max_maturity={level}` to all content API calls.

This requires knowing the active child's maturity level. Read from cookie or fetch `/me` and extract `active_child_id` → find matching child profile → get maturity_level.

**Step 3: Verify both build**

Run: `cd backend && go build ./...`
Run: `cd site-app && npm run build`

**Step 4: Commit**

```bash
git add backend/internal/handler/site_discover.go site-app/src/app/page.tsx site-app/src/app/browse/page.tsx site-app/src/app/search/page.tsx
git commit -m "feat: enforce content rating filtering for child profiles"
```

---

## Phase 3: Playback — Part A

### Task 10: Skip Intro / Skip Recap

**Files:**
- Modify: `backend/internal/models/episode.go` (add fields)
- Modify: `site-app/src/lib/types.ts` (add fields to Episode)
- Modify: `site-app/src/components/VideoPlayer.tsx` (add skip button)

**Step 1: Add fields to Episode model**

In `backend/internal/models/episode.go`, add:
```go
IntroEndSec int `bson:"intro_end_sec,omitempty" json:"intro_end_sec"`
RecapEndSec int `bson:"recap_end_sec,omitempty" json:"recap_end_sec"`
```

**Step 2: Update Episode TypeScript interface**

Add to Episode interface:
```typescript
intro_end_sec?: number
recap_end_sec?: number
```

**Step 3: Add skip button to VideoPlayer**

Add props `introEndSec?: number` and `recapEndSec?: number` to VideoPlayer.

Add state: `showSkipIntro: boolean`, `showSkipRecap: boolean`

In the `onTimeUpdate` handler, check:
```typescript
if (introEndSec && currentTime < introEndSec && currentTime > 0) {
  setShowSkipIntro(true)
} else {
  setShowSkipIntro(false)
}
// Same for recap
```

Render a floating button:
```tsx
{showSkipIntro && (
  <button
    onClick={() => player.currentTime(introEndSec)}
    className="absolute bottom-20 left-4 z-20 clay-btn bg-[var(--color-surface)] text-sm font-bold px-4 py-2"
  >
    رد کردن مقدمه
  </button>
)}
```

**Step 4: Pass props from WatchClient**

In WatchClient, pass `introEndSec={episode.intro_end_sec}` and `recapEndSec={episode.recap_end_sec}` to VideoPlayer.

**Step 5: Verify both build**

**Step 6: Commit**

```bash
git commit -m "feat: add skip intro and skip recap buttons on video player"
```

---

### Task 11: Voice Search

**Files:**
- Create: `site-app/src/components/VoiceSearchButton.tsx`
- Modify: `site-app/src/components/TopBar.tsx` (add voice button to search)

**Step 1: Create VoiceSearchButton component**

Create `site-app/src/components/VoiceSearchButton.tsx`:
```typescript
'use client'
// Props: onResult: (transcript: string) => void
// Uses window.SpeechRecognition || window.webkitSpeechRecognition
// Sets lang to 'fa-IR'
// States: idle, listening, processing
// Renders microphone icon button
// When listening: show pulsing red indicator
// On result: call onResult with transcript
// If not supported: render null
```

**Step 2: Integrate into TopBar search form**

TopBar is a server component, so add VoiceSearchButton as a client island next to the search input. On result, set the search input value and submit the form.

Need to extract search form into a client component (`SearchForm.tsx`) or add the voice button as a standalone component that manipulates the adjacent input via ref.

**Step 3: Verify frontend builds**

**Step 4: Commit**

```bash
git commit -m "feat: add voice search button with Web Speech API (Persian)"
```

---

### Task 12: Rewind / Forward ±10s Buttons

**Files:**
- Modify: `site-app/src/components/VideoPlayer.tsx`

**Step 1: Add ±10s overlay buttons**

Add two positioned buttons over the video player:
```tsx
<button
  onClick={() => playerRef.current?.currentTime(playerRef.current.currentTime() - 10)}
  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center"
  aria-label="۱۰ ثانیه جلو"
>
  <svg><!-- forward icon --></svg>
</button>
// Same for rewind on left side
```

Note: In RTL, right side = forward (matches reading direction).

**Step 2: Add double-tap gesture for mobile**

Add touch event handlers on the video container:
- Track double-tap on left half → rewind 10s
- Track double-tap on right half → forward 10s
- Show ripple animation with "۱۰−" or "+۱۰" text

**Step 3: Verify frontend builds**

**Step 4: Commit**

```bash
git commit -m "feat: add ±10 second skip buttons and double-tap gesture on video player"
```

---

## Phase 4: Playback — Part B

### Task 13: Picture-in-Picture

**Files:**
- Modify: `site-app/src/components/VideoPlayer.tsx`

**Step 1: Enable PiP in player config**

Change `pictureInPictureToggle: false` to `pictureInPictureToggle: true` in the controlBar config.

**Step 2: Verify frontend builds**

**Step 3: Commit**

```bash
git commit -m "feat: enable picture-in-picture mode on video player"
```

---

### Task 14: Caption Customization

**Files:**
- Create: `site-app/src/components/CaptionSettings.tsx`
- Modify: `site-app/src/components/VideoPlayer.tsx` (apply caption prefs)

**Step 1: Create CaptionSettings component**

Create `site-app/src/components/CaptionSettings.tsx`:
```typescript
'use client'
// Renders a settings panel with:
// - Font size: small (0.8em) / medium (1em) / large (1.4em) — 3 radio buttons
// - Background opacity: 0% / 50% / 75% / 100% — slider or 4 options
// - Text color: white / yellow — 2 color swatches
// Persists to localStorage under 'caption_prefs'
// Props: onSave: (prefs: CaptionPrefs) => void
```

**Step 2: Integrate into VideoPlayer**

On player ready, read `caption_prefs` from localStorage and apply via:
```typescript
const textTracks = player.textTracks()
// Apply styling through player.textTrackSettings if available
// Or manipulate the .vjs-text-track-display CSS directly
```

Add a gear/CC settings button that opens CaptionSettings as a popover.

**Step 3: Verify frontend builds**

**Step 4: Commit**

```bash
git commit -m "feat: add caption customization (font size, background, color)"
```

---

## Phase 5: UI/UX — Part A

### Task 15: Gamification — Backend

**Files:**
- Create: `backend/internal/models/achievement.go`
- Create: `backend/internal/models/streak.go`
- Create: `backend/internal/handler/site_gamification.go`
- Modify: `backend/internal/db/mongo.go` (add collections + indexes)
- Modify: `backend/cmd/site-api/main.go` (add routes)
- Modify: `backend/internal/handler/site_watch_progress.go` (trigger badge/streak checks)

**Step 1: Create Achievement model**

```go
package models

import (
	"time"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type Achievement struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	BadgeType string        `bson:"badge_type" json:"badge_type"`
	EarnedAt  time.Time     `bson:"earned_at" json:"earned_at"`
}
```

**Step 2: Create Streak model**

```go
type Streak struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID       bson.ObjectID `bson:"child_id" json:"child_id"`
	CurrentStreak int           `bson:"current_streak" json:"current_streak"`
	LongestStreak int           `bson:"longest_streak" json:"longest_streak"`
	LastWatchDate string        `bson:"last_watch_date" json:"last_watch_date"` // "2026-03-08"
}
```

**Step 3: Add collections and indexes**

Constants: `CollAchievements = "achievements"`, `CollStreaks = "streaks"`

Indexes:
- achievements: unique on (user_id, child_id, badge_type)
- streaks: unique on (user_id, child_id)

**Step 4: Create gamification handlers**

`site_gamification.go`:
- `GetBadges(database)` — GET `/me/children/{childId}/badges` — returns all earned achievements
- `GetStreak(database)` — GET `/me/children/{childId}/streak` — returns current/longest streak
- `CheckAndAwardBadges(database, userID, childID)` — internal function called after watch progress updates. Counts completed episodes, checks thresholds, inserts new achievements (ignore duplicate key errors).
- `UpdateStreak(database, userID, childID)` — internal function. Check last_watch_date vs today. If same day → no-op. If yesterday → increment. If older → reset to 1. Update longest if current > longest.

**Step 5: Wire badge/streak checks into UpdateWatchProgress**

In `site_watch_progress.go`, after successfully saving progress, call:
```go
go CheckAndAwardBadges(database, uid, childID)
go UpdateStreak(database, uid, childID)
```

**Step 6: Register routes and verify build**

**Step 7: Commit**

```bash
git commit -m "feat: add gamification backend (achievements, streaks, auto-award)"
```

---

### Task 16: Gamification — Frontend

**Files:**
- Create: `site-app/src/components/BadgeCard.tsx`
- Create: `site-app/src/components/StreakCounter.tsx`
- Create: `site-app/src/components/BadgeEarnedToast.tsx`
- Modify: `site-app/src/app/profiles/page.tsx` (show badges grid)
- Modify: `site-app/src/app/page.tsx` (show streak counter)

**Step 1: Create BadgeCard component**

```typescript
// Props: badgeType: string, earnedAt: string
// Maps badge types to emoji + Persian label:
// first_video: 🎬 اولین ویدیو
// streak_3: 🔥 ۳ روز پیاپی
// streak_7: 🔥 ۷ روز پیاپی
// streak_30: 🔥 ۳۰ روز پیاپی
// watched_10: 🌟 ۱۰ ویدیو
// watched_50: ⭐ ۵۰ ویدیو
// watched_100: 🏆 ۱۰۰ ویدیو
// explorer: 🧭 کاشف
// bookworm: 📚 کتابخوان
// Renders as clay-card with emoji, label, and earned date
```

**Step 2: Create StreakCounter component**

```typescript
// Props: currentStreak: number
// Renders: 🔥 + streak count in Persian numerals
// Clay-card pill shape, shown on homepage for active child
```

**Step 3: Integrate into pages**

- Profiles page: fetch badges, show grid of BadgeCards
- Homepage: fetch streak for active child, show StreakCounter

**Step 4: Verify frontend builds**

**Step 5: Commit**

```bash
git commit -m "feat: add gamification UI (badge cards, streak counter, badges grid)"
```

---

### Task 17: Animated Mascot ("توتو")

**Files:**
- Create: `site-app/src/components/Mascot.tsx`
- Create: `site-app/src/components/MascotBubble.tsx`
- Modify: `site-app/src/components/EmptyState.tsx` (add mascot)
- Modify: `site-app/src/components/TimeLockOverlay.tsx` (add sleeping mascot)
- Modify: `site-app/src/app/onboarding/page.tsx` (add waving mascot)

**Step 1: Create Mascot component**

Create `site-app/src/components/Mascot.tsx`:
```typescript
// Props: state: 'waving' | 'sleeping' | 'celebrating' | 'pointing', size?: 'sm' | 'md' | 'lg'
// Renders an SVG owl character with CSS animations per state:
// waving: gentle wave animation on wing
// sleeping: eyes closed, zzz floating, slow breathing scale
// celebrating: bouncing with confetti sparkles
// pointing: wing pointing right with gentle bob
// Uses CSS keyframes for all animations
```

**Step 2: Create MascotBubble component**

```typescript
// Props: state, message: string
// Renders: Mascot + speech bubble with Persian text
// Speech bubble: clay-card style with tail pointing to mascot
```

**Step 3: Integrate into existing components**

- EmptyState: add `<Mascot state="pointing" size="md" />` above the message
- TimeLockOverlay: replace emoji with `<Mascot state="sleeping" size="lg" />`
- Onboarding welcome step: add `<Mascot state="waving" size="lg" />`

**Step 4: Verify frontend builds**

**Step 5: Commit**

```bash
git commit -m "feat: add animated mascot character (توتو the owl) with contextual states"
```

---

## Phase 6: UI/UX — Part B

### Task 18: Expanded Avatar System (8 → 24)

**Files:**
- Modify: `site-app/src/components/CreateChildModal.tsx`
- Modify: `site-app/src/components/ProfilePicker.tsx`

**Step 1: Expand avatar definitions**

Replace the 8-avatar AVATARS array with 24 avatars in 4 categories:
```typescript
const AVATAR_CATEGORIES = [
  { name: 'حیوانات', avatars: [
    { key: 'bear', emoji: '🐻' }, { key: 'cat', emoji: '🐱' },
    { key: 'elephant', emoji: '🐘' }, { key: 'rabbit', emoji: '🐰' },
    { key: 'dolphin', emoji: '🐬' }, { key: 'penguin', emoji: '🐧' },
    { key: 'butterfly', emoji: '🦋' }, { key: 'lion', emoji: '🦁' },
  ]},
  { name: 'فضا', avatars: [
    { key: 'rocket', emoji: '🚀' }, { key: 'astronaut', emoji: '👨‍🚀' },
    { key: 'planet', emoji: '🪐' }, { key: 'star', emoji: '⭐' },
  ]},
  { name: 'طبیعت', avatars: [
    { key: 'flower', emoji: '🌸' }, { key: 'tree', emoji: '🌳' },
    { key: 'rainbow', emoji: '🌈' }, { key: 'sun', emoji: '☀️' },
  ]},
  { name: 'سرگرمی', avatars: [
    { key: 'robot', emoji: '🤖' }, { key: 'unicorn', emoji: '🦄' },
    { key: 'wizard', emoji: '🧙' }, { key: 'pirate', emoji: '🏴‍☠️' },
    { key: 'superhero', emoji: '🦸' }, { key: 'ninja', emoji: '🥷' },
    { key: 'dragon', emoji: '🐉' }, { key: 'mermaid', emoji: '🧜‍♀️' },
  ]},
]
```

**Step 2: Update CreateChildModal grid**

Show category tabs or headers, with avatars grouped underneath. Keep grid-cols-4.

**Step 3: Update ProfilePicker's AVATAR_EMOJIS map**

Add all 24 emoji mappings so profile display works for new avatars.

**Step 4: Verify frontend builds**

**Step 5: Commit**

```bash
git commit -m "feat: expand avatar system from 8 to 24 with categorized selection"
```

---

### Task 19: Sound Effects & Audio Cues

**Files:**
- Create: `site-app/src/components/SoundProvider.tsx`
- Create: `site-app/src/hooks/useSoundEffects.ts`
- Modify: `site-app/src/app/layout.tsx` (wrap with SoundProvider)

**Step 1: Create SoundProvider context**

```typescript
'use client'
// Context provides: playSound(name), soundEnabled, setSoundEnabled
// Sound names: 'tap', 'badge', 'switch', 'countdown', 'success'
// Reads/writes localStorage 'sound_enabled'
// Preloads Audio objects for each sound
// Default: enabled for child profiles, disabled for parent
```

**Step 2: Create useSoundEffects hook**

```typescript
// Returns: { play: (name) => void, enabled: boolean, toggle: () => void }
// Wraps SoundProvider context
```

**Step 3: Add placeholder sound files**

Create empty/placeholder mp3 files in `site-app/public/sounds/`:
- tap.mp3, badge.mp3, switch.mp3, countdown.mp3, success.mp3

(These would be replaced with actual sound files later)

**Step 4: Wrap layout with SoundProvider**

In layout.tsx, wrap inside ThemeProvider.

**Step 5: Verify frontend builds**

**Step 6: Commit**

```bash
git commit -m "feat: add sound effects system with provider, hook, and toggle"
```

---

### Task 20: Dark Mode Auto-Detect

**Files:**
- Modify: `site-app/src/components/ThemeProvider.tsx`

**Step 1: Add OS preference detection**

In ThemeProvider's useEffect, before reading localStorage:
```typescript
const stored = localStorage.getItem('theme')
if (!stored) {
  // No manual selection — auto-detect from OS
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
  const autoTheme = prefersDark.matches ? 'dark' : 'light'
  applyTheme(autoTheme)

  // Listen for OS changes
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  }
  prefersDark.addEventListener('change', handler)
  return () => prefersDark.removeEventListener('change', handler)
} else {
  applyTheme(stored)
}
```

When user manually selects a theme via ThemeToggle, it writes to localStorage, stopping auto-detect.

**Step 2: Verify frontend builds**

**Step 3: Commit**

```bash
git commit -m "feat: auto-detect dark mode from OS preference when no theme selected"
```

---

### Task 21: Onboarding Feature Discovery Tooltips

**Files:**
- Create: `site-app/src/components/FeatureTooltip.tsx`
- Create: `site-app/src/hooks/useOnboardingTour.ts`
- Modify: `site-app/src/app/layout.tsx` (add tour overlay)

**Step 1: Create FeatureTooltip component**

```typescript
'use client'
// Props: targetSelector: string, message: string, mascotState, position: 'top'|'bottom'|'left'|'right', onNext, onSkip
// Renders:
// 1. Full-screen semi-transparent overlay (bg-black/30)
// 2. Highlight ring around target element (positioned via getBoundingClientRect)
// 3. MascotBubble next to the highlight with the message
// 4. "بعدی" (Next) and "رد کردن" (Skip All) buttons
```

**Step 2: Create useOnboardingTour hook**

```typescript
// Manages tour state:
// - currentStep: number
// - completed: boolean (read from localStorage 'onboarding_tour_done')
// - Tour steps definition:
//   0: { selector: '[data-tour="search"]', message: 'اینجا می‌تونی جستجو کنی!', position: 'bottom' }
//   1: { selector: '[data-tour="sidebar"]', message: 'منوی اصلی اینجاست', position: 'left' }
//   2: { selector: '[data-tour="profiles"]', message: 'پروفایل‌ها رو اینجا عوض کن', position: 'bottom' }
//   3: { selector: '[data-tour="bookmark"]', message: 'ویدیوهای مورد علاقه رو ذخیره کن', position: 'bottom' }
// - next() advances step, skip() marks complete
// - On last step next() marks complete
```

**Step 3: Add data-tour attributes to existing components**

Add `data-tour="search"` to search input in TopBar, `data-tour="sidebar"` to sidebar toggle, etc.

**Step 4: Add tour overlay to layout**

In layout.tsx, render a `<OnboardingTour />` wrapper component that uses the hook and renders FeatureTooltip for the current step.

**Step 5: Verify frontend builds**

**Step 6: Commit**

```bash
git commit -m "feat: add onboarding feature discovery tooltips with mascot guide"
```

---

## Final Verification

### Task 22: Full Build Verification

**Step 1: Backend build**

Run: `cd backend && go build ./...`
Expected: No errors

**Step 2: Frontend build**

Run: `cd site-app && npm run build`
Expected: Build succeeds with all routes

**Step 3: Final commit if any fixes needed**

---

## Summary

| Phase | Tasks | Features |
|-------|-------|----------|
| 1 | 1-5 | Bedtime lockout, episode blocking, kid-proof exit |
| 2 | 6-9 | Pause history, child passcodes, content rating enforcement |
| 3 | 10-12 | Skip intro/recap, voice search, ±10s buttons |
| 4 | 13-14 | Picture-in-Picture, caption customization |
| 5 | 15-17 | Gamification (badges/streaks), mascot character |
| 6 | 18-21 | Expanded avatars, sound effects, auto-detect theme, onboarding tooltips |
| Final | 22 | Full build verification |
