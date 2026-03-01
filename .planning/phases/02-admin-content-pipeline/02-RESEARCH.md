# Phase 02: Admin Content Pipeline - Research

**Researched:** 2026-03-01
**Domain:** Go REST API (chi), JWT auth, yt-dlp subprocess, FFmpeg HLS transcoding, Next.js 16 admin UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dashboard layout & navigation
- Sidebar + content area layout (fixed left sidebar with nav links, main content on right)
- Sidebar nav items: Channels, Episodes, Categories, Age Groups, Jobs
- Data tables with sortable columns and search bar for all content lists
- Dedicated full-page forms for create/edit (navigate to form page, back button returns to list)
- Admin panel UI in English with LTR layout

#### Video ingestion UX
- YouTube URL is a field on the episode create/edit form — one action creates the episode and triggers ingestion
- After submitting an episode with a YouTube URL, redirect back to the episodes list with job status shown as a badge/icon in the table row
- Auto-fetch YouTube metadata (title, description, thumbnail URL, duration) after pasting a URL — pre-fill form fields, admin can edit before saving
- Dedicated "Jobs" page in the sidebar nav showing all ingestion jobs (active, completed, failed) in a filterable table

#### Content relationships
- Each channel belongs to exactly one category and exactly one age group
- Episodes within a channel have a manual sort order (sort number field) for controlling sequence
- Age groups are admin-managed with full CRUD (not fixed/predefined)
- Channel artwork via image URL field (no file upload in this phase)

#### Job status & error handling
- Job status updates via polling (every ~5 seconds) from the admin panel
- Status displayed as colored badges: yellow (pending), blue (downloading), purple (transcoding), green (ready), red (failed)
- Failed jobs show an expandable row in the jobs table revealing error message and a retry button
- Retry re-queues from the failed step (if download succeeded, only retry transcoding; if download failed, retry from download)

### Claude's Discretion
- Exact table column choices and widths
- Form field validation rules and error messages
- Polling interval tuning
- Sidebar visual design and active state indicators
- Episode form field layout and ordering
- JWT token expiry duration and refresh strategy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Admin can create, edit, and delete channels with name, description, thumbnail, category, and age group | Go chi CRUD handlers + mongo-driver v2 + Next.js server actions |
| CONT-02 | Admin can create, edit, and delete episodes within a channel with title, description, order, and subtitle file | Go chi CRUD handlers, Episode model already defined in Phase 1 |
| CONT-03 | Admin can create, edit, and delete categories | Go chi CRUD handlers, Category model already defined |
| CONT-04 | Admin can create, edit, and delete age groups | Go chi CRUD handlers, AgeGroup model already defined |
| CONT-05 | Admin can assign categories and age groups to channels | Channel.CategoryIDs and Channel.AgeGroupIDs already defined as []bson.ObjectID |
| CONT-06 | Admin panel displays all content in a dashboard UI with tables, search, and filters | Next.js 16 App Router with server components, data tables, client-side search |
| VIDE-01 | Admin can paste a YouTube URL and trigger async download + HLS transcode | Episode form + server action → POST /episodes → 202 response + worker queue |
| VIDE-02 | System downloads video via yt-dlp with rate-limiting protection (sequential queue, sleep intervals) | Single-worker goroutine reading from buffered channel; yt-dlp --sleep-requests flags |
| VIDE-03 | FFmpeg transcodes to multi-rendition HLS (360p, 480p, 720p) with keyframe-aligned segments and master playlist | FFmpeg -g/-keyint_min flags, hls_segment_filename per rendition, -master_pl_name |
| VIDE-04 | Job status (pending/downloading/transcoding/ready/failed) is visible in admin panel with real-time updates | Polling every 5s via useEffect + fetch against GET /jobs endpoint |
| VIDE-05 | Failed jobs show error details and can be retried | Job.Error field + PATCH /jobs/:id/retry endpoint, frontend expandable row |
| VIDE-06 | HLS segments are written to a Docker volume served by nginx | admin-api container needs ./data/hls:/data/hls:rw volume mount (currently missing) |
| ADMN-01 | Admin can log in with credentials | POST /auth/login → bcrypt compare → jwtauth.New token → cookie |
| ADMN-02 | Admin API endpoints are protected by JWT authentication | go-chi/jwtauth v5 Verifier + Authenticator middleware on protected route group |
</phase_requirements>

---

## Summary

Phase 2 builds the full admin content pipeline on top of the Phase 1 foundation. Three distinct subsystems must be wired together: (1) a Go REST API on admin-api with JWT auth protecting all CRUD and ingestion endpoints, (2) a sequential background worker (goroutine + channel) that runs yt-dlp then FFmpeg for each job, and (3) a Next.js 16 admin dashboard with sidebar layout, data tables, forms, and polling-based job status updates.

All Go models and MongoDB indexes were defined in Phase 1 (User, Channel, Episode, Category, AgeGroup, Job — all in `backend/internal/models/`). The admin-api binary already bootstraps chi with RequestID/Logger/Recoverer middleware on port 8082. The Next.js admin-app already has Tailwind v4, Vazirmatn font, and `basePath: '/admin'` configured. The nginx proxy already strips `/api/admin/` prefix and forwards to admin-api. What is missing is all business logic: handlers, auth, worker, and UI.

Two critical infrastructure gaps exist. First, the `admin-api` Docker service has no HLS volume mount — the `docker-compose.yml` must add `./data/hls:/data/hls:rw` to admin-api. Second, the `backend/Dockerfile` admin-api runtime stage only installs `wget` on alpine:3.19; it does NOT include yt-dlp or ffmpeg. Both must be added to the Dockerfile before any video ingestion can function.

**Primary recommendation:** Build in four sequential waves — (1) Dockerfile + docker-compose infrastructure fixes + JWT auth, (2) CRUD REST handlers for all five collections, (3) ingestion worker + job management, (4) Next.js admin UI with tables/forms/polling.

---

## Standard Stack

### Core (Go backend)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| go-chi/chi/v5 | v5.2.5 | HTTP router (already installed) | Already in go.mod; consistent with Phase 1 |
| go-chi/jwtauth/v5 | v5.4.0 | JWT auth middleware for chi | Official chi ecosystem JWT library; uses lestrrat-go/jwx underneath; HS256 out of box |
| golang.org/x/crypto/bcrypt | part of x/crypto (already indirect dep) | Password hashing | Standard Go bcrypt; DefaultCost=10; GenerateFromPassword + CompareHashAndPassword |
| go.mongodb.org/mongo-driver/v2 | v2.5.0 | MongoDB (already installed) | Already in go.mod; bson.ObjectID pattern established in Phase 1 |

### Core (Next.js frontend)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router framework (already installed) | Already in package.json |
| react | 19.2.3 | UI runtime (already installed) | Already in package.json |
| tailwindcss | ^4 | Styling (already installed) | Already configured with @theme in globals.css |
| jose | ^5 | JWT sign/verify in Next.js (server-only) | Recommended by Next.js official auth docs; Edge Runtime compatible |

### Supporting (system binaries in Docker)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| yt-dlp | latest (pip install) | YouTube download | Invoked via os/exec from worker goroutine in admin-api container |
| ffmpeg | alpine apk | HLS transcoding | Invoked via os/exec from worker goroutine in admin-api container |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| go-chi/jwtauth/v5 | golang-jwt/jwt/v5 directly | jwtauth provides Verifier/Authenticator middleware ready-to-use; saves boilerplate |
| jose (in Next.js) | iron-session | jose is a pure JWT solution matching what Go issues; iron-session is simpler but uses symmetric encryption, not JWT |
| useEffect + fetch for polling | SWR with refreshInterval | SWR adds dependency; plain useEffect + setInterval is sufficient for ~5s polling |
| os/exec for yt-dlp | lrstanley/go-ytdlp | go-ytdlp adds a dependency; os/exec is transparent, zero-dep, and sufficient |

**Installation (Go):**
```bash
cd backend
go get github.com/go-chi/jwtauth/v5
```
Note: `golang.org/x/crypto` is already an indirect dependency in go.mod — `bcrypt` is available without a new `go get`.

**Installation (Next.js admin-app):**
```bash
cd admin-app
npm install jose
```

---

## Architecture Patterns

### Recommended Project Structure

**Backend additions to `backend/internal/`:**
```
backend/
├── Dockerfile                    # Must add yt-dlp + ffmpeg to admin-api stage
├── cmd/admin-api/main.go         # Wire new routes + start worker
├── cmd/seed/main.go              # One-time admin user seeder
├── internal/
│   ├── auth/
│   │   └── jwt.go                # tokenAuth = jwtauth.New("HS256", secret, nil); token encode/decode helpers
│   ├── handler/
│   │   ├── health.go             # Existing — unchanged
│   │   ├── auth.go               # POST /auth/login, POST /auth/logout
│   │   ├── channel.go            # CRUD for channels
│   │   ├── episode.go            # CRUD for episodes (includes YouTube URL ingestion trigger)
│   │   ├── category.go           # CRUD for categories
│   │   ├── age_group.go          # CRUD for age groups
│   │   ├── job.go                # GET /jobs, GET /jobs/:id, PATCH /jobs/:id/retry
│   │   └── youtube.go            # GET /youtube-meta?url=... (metadata pre-fetch)
│   ├── worker/
│   │   └── processor.go          # Single-worker goroutine: channel<-JobRequest, runs yt-dlp then ffmpeg
│   ├── models/                   # Existing — all models already defined in Phase 1
│   └── db/
│       └── mongo.go              # Existing — collection names already defined
```

**Admin app additions to `admin-app/src/`:**
```
admin-app/src/
├── app/
│   ├── layout.tsx                # Existing — update to add Sidebar + LTR dir
│   ├── page.tsx                  # Redirect to /channels
│   ├── login/
│   │   └── page.tsx              # Login form (no auth required)
│   ├── channels/
│   │   ├── page.tsx              # Channels list (table)
│   │   └── [id]/
│   │       └── page.tsx          # Create/Edit channel form
│   ├── episodes/
│   │   ├── page.tsx              # Episodes list (table) with job status badges
│   │   └── [id]/
│   │       └── page.tsx          # Create/Edit episode form (with YouTube URL field)
│   ├── categories/
│   │   ├── page.tsx              # Categories list + inline create
│   │   └── [id]/page.tsx
│   ├── age-groups/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── jobs/
│       └── page.tsx              # Jobs table with polling (client component)
├── components/
│   ├── Sidebar.tsx               # Fixed left sidebar with nav links (LTR)
│   ├── DataTable.tsx             # Reusable table with sort + search
│   ├── StatusBadge.tsx           # Colored badge for job status
│   └── JobsTable.tsx             # Client component with polling
├── lib/
│   ├── fonts.ts                  # Existing
│   ├── session.ts                # Cookie-based JWT session (jose encrypt/decrypt)
│   └── api.ts                    # fetch wrapper for /api/admin/* calls
└── middleware.ts                  # Protect all routes except /login
```

### Pattern 1: JWT Middleware in chi (Go backend)

**What:** Use `jwtauth.Verifier` + `jwtauth.Authenticator` as a chi route group middleware.
**When to use:** Wrap all admin API routes except `/auth/login`.

```go
// Source: https://github.com/go-chi/jwtauth (v5.4.0, 2026-02-26)
package auth

import (
    "os"
    "github.com/go-chi/jwtauth/v5"
)

var TokenAuth *jwtauth.JWTAuth

func init() {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        panic("JWT_SECRET env var not set")
    }
    TokenAuth = jwtauth.New("HS256", []byte(secret), nil)
}

// IssueToken returns a signed JWT string for the given admin user ID.
func IssueToken(userID string) (string, error) {
    _, tokenString, err := TokenAuth.Encode(map[string]interface{}{
        "user_id": userID,
        "role":    "admin",
    })
    return tokenString, err
}
```

```go
// In cmd/admin-api/main.go — protected route group
r.Group(func(r chi.Router) {
    r.Use(jwtauth.Verifier(auth.TokenAuth))
    r.Use(jwtauth.Authenticator(auth.TokenAuth))

    r.Route("/channels", channelRoutes)
    r.Route("/episodes", episodeRoutes)
    r.Route("/categories", categoryRoutes)
    r.Route("/age-groups", ageGroupRoutes)
    r.Route("/jobs", jobRoutes)
    r.Get("/youtube-meta", handler.YouTubeMeta)
})

// Public routes (no auth)
r.Post("/auth/login", handler.Login(database))
```

### Pattern 2: Admin Login Handler (Go)

**What:** POST /auth/login — validate credentials against MongoDB `users` collection, bcrypt compare, return JWT.

```go
// Source: pkg.go.dev/golang.org/x/crypto/bcrypt
func Login(db *mongo.Database) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            Email    string `json:"email"`
            Password string `json:"password"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid request", http.StatusBadRequest)
            return
        }

        // Find admin user
        var user models.User
        err := db.Collection(db.CollUsers).FindOne(r.Context(),
            bson.D{{Key: "email", Value: req.Email}, {Key: "role", Value: "admin"}},
        ).Decode(&user)
        if err != nil {
            http.Error(w, "invalid credentials", http.StatusUnauthorized)
            return
        }

        // Compare password
        if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
            http.Error(w, "invalid credentials", http.StatusUnauthorized)
            return
        }

        // Issue token
        token, _ := auth.IssueToken(user.ID.Hex())
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"token": token})
    }
}
```

**Admin seeding:** A `cmd/seed/main.go` reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars, bcrypt-hashes the password, and upserts an admin user into the `users` collection.

### Pattern 3: Single-Worker Sequential Job Queue (Go)

**What:** A single goroutine reads from a buffered channel; one job processes at a time (never concurrent) to avoid YouTube 429s.
**When to use:** Video ingestion worker — started at admin-api startup.

```go
// Source: gobyexample.com/worker-pools + STATE.md decision
package worker

type JobRequest struct {
    JobID     bson.ObjectID
    EpisodeID bson.ObjectID
    SourceURL string
}

var jobQueue = make(chan JobRequest, 100) // buffered — never blocks the HTTP handler

// Start launches the single sequential worker. Call from main().
func Start(ctx context.Context, db *mongo.Database, hlsRoot string) {
    go func() {
        for {
            select {
            case job := <-jobQueue:
                processJob(ctx, db, hlsRoot, job)
            case <-ctx.Done():
                return
            }
        }
    }()
}

// Enqueue adds a job to the queue (called from episode CREATE handler).
func Enqueue(req JobRequest) {
    jobQueue <- req
}

func processJob(ctx context.Context, db *mongo.Database, hlsRoot string, req JobRequest) {
    // 1. Update job status to "downloading"
    updateJobStatus(ctx, db, req.JobID, models.JobStatusDownloading, "")

    // 2. Download via yt-dlp
    outputPath := filepath.Join(hlsRoot, req.EpisodeID.Hex(), "source.mp4")
    os.MkdirAll(filepath.Dir(outputPath), 0755)

    cmd := exec.CommandContext(ctx, "yt-dlp",
        "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
        "--merge-output-format", "mp4",
        "--sleep-requests", "5",        // 5s between requests (avoids 429)
        "--no-playlist",
        "-o", outputPath,
        req.SourceURL,
    )
    if err := cmd.Run(); err != nil {
        updateJobStatus(ctx, db, req.JobID, models.JobStatusFailed, err.Error())
        return
    }

    // 3. Update status to "transcoding"
    updateJobStatus(ctx, db, req.JobID, models.JobStatusTranscoding, "")

    // 4. Transcode to HLS
    if err := transcodeHLS(ctx, outputPath, hlsRoot, req.EpisodeID.Hex()); err != nil {
        updateJobStatus(ctx, db, req.JobID, models.JobStatusFailed, err.Error())
        return
    }

    // 5. Mark ready + clean up source file
    updateJobStatus(ctx, db, req.JobID, models.JobStatusReady, "")
    os.Remove(outputPath)
}
```

### Pattern 4: FFmpeg Multi-Rendition HLS Transcoding

**What:** Transcode source.mp4 to 3 HLS renditions with aligned keyframes and a master.m3u8.
**When to use:** Step 4 of processJob above.

```go
// Source: mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg +
//         gist.github.com/maitrungduc1410/9c640c61a7871390843af00ae1d8758e
// STATE.md decision: use -force_key_frames "expr:gte(t,n_forced*6)"
func transcodeHLS(ctx context.Context, inputPath, hlsRoot, episodeID string) error {
    outDir := filepath.Join(hlsRoot, episodeID)
    os.MkdirAll(outDir, 0755)

    args := []string{
        "-i", inputPath,
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3];" +
            "[v1]scale=w=1280:h=720[v1out];" +
            "[v2]scale=w=854:h=480[v2out];" +
            "[v3]scale=w=640:h=360[v3out]",
        // 720p
        "-map", "[v1out]", "-c:v:0", "libx264", "-b:v:0", "2800k",
        "-maxrate:v:0", "2996k", "-bufsize:v:0", "4200k",
        // 480p
        "-map", "[v2out]", "-c:v:1", "libx264", "-b:v:1", "1400k",
        "-maxrate:v:1", "1498k", "-bufsize:v:1", "2100k",
        // 360p
        "-map", "[v3out]", "-c:v:2", "libx264", "-b:v:2", "800k",
        "-maxrate:v:2", "856k", "-bufsize:v:2", "1200k",
        // Audio (3 copies, one per rendition)
        "-map", "a:0", "-c:a:0", "aac", "-b:a:0", "192k", "-ac", "2",
        "-map", "a:0", "-c:a:1", "aac", "-b:a:1", "128k", "-ac", "2",
        "-map", "a:0", "-c:a:2", "aac", "-b:a:2", "96k", "-ac", "2",
        // Keyframe alignment — every 6 seconds (per STATE.md note)
        // -g 180 assumes 30fps source; for unknown fps use -force_key_frames "expr:gte(t,n_forced*6)"
        "-g", "180", "-keyint_min", "180", "-sc_threshold", "0",
        // HLS output
        "-f", "hls",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_flags", "independent_segments",
        "-hls_segment_type", "mpegts",
        "-hls_segment_filename", filepath.Join(outDir, "%v", "seg%03d.ts"),
        "-master_pl_name", "master.m3u8",
        "-var_stream_map", "v:0,a:0 v:1,a:1 v:2,a:2",
        filepath.Join(outDir, "%v", "playlist.m3u8"),
    }

    cmd := exec.CommandContext(ctx, "ffmpeg", args...)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    return cmd.Run()
}
```

**Output structure on disk:**
```
./data/hls/{episode_id}/
├── master.m3u8           <- served at /hls/{episode_id}/master.m3u8
├── 0/                    <- 720p rendition
│   ├── playlist.m3u8
│   └── seg000.ts, seg001.ts, ...
├── 1/                    <- 480p rendition
│   ├── playlist.m3u8
│   └── seg000.ts, ...
└── 2/                    <- 360p rendition
    ├── playlist.m3u8
    └── seg000.ts, ...
```

### Pattern 5: yt-dlp JSON Metadata Pre-fetch (for form auto-fill)

**What:** Admin pastes a YouTube URL; the admin-app calls Go backend `GET /youtube-meta?url=...` which runs `yt-dlp --dump-json` and returns key fields.
**When to use:** Triggered on YouTube URL field blur in the episode form.

```go
// GET /youtube-meta?url=... — authenticated, runs in admin-api container where yt-dlp is installed
func YouTubeMeta(w http.ResponseWriter, r *http.Request) {
    url := r.URL.Query().Get("url")
    if url == "" {
        http.Error(w, "url param required", http.StatusBadRequest)
        return
    }

    cmd := exec.CommandContext(r.Context(), "yt-dlp",
        "--dump-json",
        "--no-playlist",
        url,
    )
    out, err := cmd.Output()
    if err != nil {
        http.Error(w, "failed to fetch metadata", http.StatusBadGateway)
        return
    }

    var meta map[string]interface{}
    json.Unmarshal(out, &meta)

    // Return only needed fields
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "title":       meta["title"],
        "description": meta["description"],
        "thumbnail":   meta["thumbnail"],
        "duration":    meta["duration"],
    })
}
```

**The yt-dlp JSON output fields:**
- `title` → episode title (string)
- `description` → episode description (string)
- `thumbnail` → best thumbnail URL (string)
- `duration` → duration in seconds (float64)

### Pattern 6: Next.js Admin Session & Route Protection

**What:** JWT stored in httpOnly cookie; middleware.ts protects all `/channels`, `/episodes`, etc. routes.
**When to use:** All admin pages except `/login`.

```typescript
// Source: nextjs.org/docs/app/guides/authentication (version 16.1.6, 2026-02-27)
// admin-app/src/lib/session.ts
import 'server-only'
import { cookies } from 'next/headers'

export async function createSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',  // CRITICAL: must be '/' not '/admin' so cookie is sent to /api/admin/*
  })
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_token')?.value ?? null
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
}
```

```typescript
// admin-app/src/middleware.ts
// Source: nextjs.org/docs/app/guides/authentication
import { NextRequest, NextResponse } from 'next/server'

const publicPaths = ['/admin/login']

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublic = publicPaths.some(p => path.startsWith(p))
  const token = req.cookies.get('admin_token')?.value

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
  }
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/admin/channels', req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

**Important:** The admin-app's `basePath: '/admin'` means all routes start with `/admin`. The middleware matcher must account for this.

### Pattern 7: Polling for Job Status (Next.js Client Component)

**What:** Client component polls GET /api/admin/jobs every 5 seconds; updates badge colors.

```typescript
// admin-app/src/app/jobs/page.tsx (or jobs table component)
'use client'
import { useEffect, useState } from 'react'

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  downloading: 'bg-blue-100 text-blue-800',
  transcoding: 'bg-purple-100 text-purple-800',
  ready:       'bg-green-100 text-green-800',
  failed:      'bg-red-100 text-red-800',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    const fetchJobs = async () => {
      const res = await fetch('/api/admin/jobs', { credentials: 'include' })
      if (res.ok) setJobs(await res.json())
    }
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)  // cleanup on unmount
  }, [])

  return (/* table with status badges */)
}
```

**Note:** The admin-app sends requests to `/api/admin/...` (absolute nginx path). Since the admin-app is server-side rendered at `basePath: '/admin'`, client-side fetch must use the full path `/api/admin/jobs` not `/jobs`.

### Anti-Patterns to Avoid

- **Running yt-dlp concurrently:** YouTube rate-limits aggressively. The job queue MUST be a single goroutine. Never spawn parallel downloads.
- **Storing JWT in localStorage:** XSS-vulnerable. Use httpOnly cookie only.
- **Hardcoding admin password in code:** Must use bcrypt-hashed password in MongoDB, seeded via `cmd/seed/main.go`.
- **Writing HLS files synchronously in the HTTP handler:** The HTTP handler must return 202 immediately and enqueue; never block on FFmpeg.
- **Not cleaning up source.mp4:** After transcoding completes successfully, delete `source.mp4` to save disk space. HLS segments are all that's needed.
- **Using raw `bson.M` for MongoDB queries:** STATE.md decision: decode into typed Go structs always.
- **Passing JWT in Authorization header from Next.js:** The admin-app sends the JWT via cookie; the Go backend uses `jwtauth.TokenFromCookie("admin_token")`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT sign/verify in Go | Custom HMAC code | go-chi/jwtauth/v5 | Handles token extraction from header/cookie/query, Verifier, Authenticator middleware |
| JWT in Next.js | Custom crypto code | jose (SignJWT, jwtVerify) | Edge-compatible, recommended by Next.js official docs |
| Password hashing | Custom hash function | golang.org/x/crypto/bcrypt | bcrypt has built-in salt + work factor; already an indirect dep |
| YouTube download | Custom HTTP client | yt-dlp binary via os/exec | yt-dlp handles authentication, format selection, throttling |
| HLS transcoding | Custom segmenter | ffmpeg binary via os/exec | libx264 + HLS muxer handle keyframes, segments, playlists |
| Job queue | Redis/BullMQ | Go buffered channel + single goroutine | Zero infra overhead; sequential by design; sufficient for admin-only volume |

**Key insight:** The job pipeline is intentionally simple (single admin, low volume). A buffered Go channel with one worker goroutine replaces any external queue system entirely.

---

## Common Pitfalls

### Pitfall 1: Missing yt-dlp and ffmpeg in admin-api Docker Image
**What goes wrong:** Worker goroutine calls `exec.Command("yt-dlp", ...)` and gets "executable file not found in $PATH".
**Why it happens:** `backend/Dockerfile` admin-api runtime stage is `FROM alpine:3.19` with only `wget` installed. yt-dlp and ffmpeg are not present.
**How to avoid:** Update the admin-api stage in `backend/Dockerfile`:
```dockerfile
# Admin API runtime
FROM alpine:3.19 AS admin-api
RUN apk add --no-cache wget ffmpeg python3 py3-pip && \
    pip3 install --no-cache-dir yt-dlp --break-system-packages
COPY --from=admin-api-build /bin/admin-api /bin/admin-api
ENTRYPOINT ["/bin/admin-api"]
```
**Warning signs:** Worker immediately fails all jobs with "exec: yt-dlp not found" error.

### Pitfall 2: Missing HLS Volume Mount on admin-api
**What goes wrong:** Worker goroutine writes HLS segments to `/data/hls/` inside the admin-api container, but nginx tries to serve from `./data/hls` on the host. Files never appear.
**Why it happens:** docker-compose.yml defines the HLS bind mount only for nginx (`./data/hls:/var/www/hls:ro`). The admin-api service has no HLS mount.
**How to avoid:** Add to `admin-api` service in docker-compose.yml:
```yaml
volumes:
  - ./data/hls:/data/hls:rw
environment:
  HLS_ROOT: "/data/hls"
  JWT_SECRET: "${JWT_SECRET}"
```
The worker writes to `HLS_ROOT + "/" + episodeID`; nginx reads from `./data/hls` (same host path, different container).
**Warning signs:** Job status reaches "ready" but `/hls/{id}/master.m3u8` returns 404.

### Pitfall 3: FFmpeg Keyframe Misalignment Breaks ABR Switching
**What goes wrong:** Adaptive bitrate switching stutters or fails in Video.js because keyframes across renditions are at different timestamps.
**Why it happens:** Default x264 encoding places keyframes based on scene detection (`-sc_threshold` not set), causing them to diverge between renditions.
**How to avoid:** Always set `-g 180 -keyint_min 180 -sc_threshold 0` (for 30fps source = 6-second keyframe interval). The `-g` value should match `fps * hls_time`. Validate with `ffprobe -select_streams v:0 -show_frames -of csv -i 720/playlist.m3u8 | grep key_frame`.
**Warning signs:** STATE.md already flags this: "FFmpeg keyframe alignment is complex".

### Pitfall 4: yt-dlp 429 Rate Limit
**What goes wrong:** yt-dlp gets HTTP 429 (Too Many Requests) from YouTube after multiple downloads.
**Why it happens:** YouTube throttles rapid sequential requests.
**How to avoid:** The worker must never run concurrent downloads. Additionally, pass `--sleep-requests 5` to yt-dlp (adds 5s sleep between fragment requests). The sequential goroutine queue is the primary protection.
**Warning signs:** Job fails with error containing "HTTP Error 429" or "rate limit".

### Pitfall 5: admin_token Cookie Not Sent to Go Backend
**What goes wrong:** The admin-app sends requests to `/api/admin/...` but the JWT cookie is scoped to `/admin` path, not `/`.
**Why it happens:** If `cookieStore.set('admin_token', ...)` uses `path: '/admin'`, the cookie won't be sent when the browser fetches `/api/admin/...`.
**How to avoid:** Set cookie with `path: '/'` so it is sent for all paths including `/api/admin/...`. Go backend uses `jwtauth.TokenFromCookie("admin_token")`.
**Warning signs:** GET /api/admin/channels returns 401 even after successful login.

### Pitfall 6: basePath Confuses API Fetch Calls
**What goes wrong:** Client-side `fetch('/channels')` in admin-app resolves to `/admin/channels` (Next.js prepends basePath), not `/api/admin/channels`.
**Why it happens:** Next.js `basePath: '/admin'` automatically prefixes all `<Link>` and `router.push()` calls, but NOT `fetch()` calls. fetch() paths are literal.
**How to avoid:** All `fetch()` calls in admin-app must use the full nginx path: `fetch('/api/admin/channels')`. Never use relative paths for API calls.
**Warning signs:** fetch returns HTML (the admin-app page) instead of JSON.

### Pitfall 7: FFmpeg Source File Not Found in Docker
**What goes wrong:** os/exec `ffmpeg -i /data/hls/{id}/source.mp4` fails with "No such file or directory".
**Why it happens:** yt-dlp writes the file; if yt-dlp uses a different output path than the FFmpeg input path, or if yt-dlp appends a format suffix (e.g. `source.mp4.webm`), the path doesn't match.
**How to avoid:** Use `--merge-output-format mp4` and `--no-playlist` in yt-dlp. Use a deterministic output path: `filepath.Join(hlsRoot, episodeID.Hex(), "source.mp4")`. Pass the same path to both yt-dlp `-o` and ffmpeg `-i`.

### Pitfall 8: Retry Logic — Wrong Step Determination
**What goes wrong:** Retry always restarts from download, even when only transcoding failed (wasting time re-downloading).
**Why it happens:** No flag distinguishes download-failed vs. transcode-failed in the Job model.
**How to avoid:** Add a `FailedStep string` field to the Job model (`"download"` or `"transcode"`). The retry handler reads this field to determine which step to restart from. Alternatively, check if `source.mp4` exists on disk as a heuristic.

### Pitfall 9: Next.js Server Actions Cannot Call nginx Internally
**What goes wrong:** Server action tries to fetch `http://localhost/api/admin/channels` and gets a connection refused or routing loop.
**Why it happens:** Inside the admin-app Docker container, `localhost` is the Next.js process, not nginx. The nginx proxy is only reachable from outside.
**How to avoid:** Server actions call the Go backend directly via Docker internal DNS: `http://admin-api:8082/channels`. Inject as `ADMIN_API_INTERNAL_URL=http://admin-api:8082` env var.

---

## Code Examples

Verified patterns from official sources:

### go-chi/jwtauth v5: Token Extraction from Cookie
```go
// Source: https://github.com/go-chi/jwtauth (v5.4.0)
// By default, jwtauth.Verifier extracts from Authorization header.
// To also extract from cookie named "admin_token":
r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromCookie("admin_token"), jwtauth.TokenFromHeader))
```

### bcrypt: Hash and Compare
```go
// Source: https://pkg.go.dev/golang.org/x/crypto/bcrypt
import "golang.org/x/crypto/bcrypt"

// Hash (during user creation/seed):
hash, err := bcrypt.GenerateFromPassword([]byte("plaintextPassword"), bcrypt.DefaultCost)

// Compare (during login):
err = bcrypt.CompareHashAndPassword(hash, []byte("plaintextPassword"))
// err == nil means match; err == bcrypt.ErrMismatchedHashAndPassword means mismatch
```

### mongo-driver v2: Insert + FindOne Pattern (consistent with Phase 1)
```go
// Source: go.mongodb.org/mongo-driver/v2 (already in go.mod)
// Pattern established in Phase 1: use bson.ObjectID, decode into typed structs

// Create:
now := time.Now()
ch := models.Channel{
    Name:        "My Channel",
    CategoryIDs: []bson.ObjectID{catID},
    AgeGroupIDs: []bson.ObjectID{ageID},
    CreatedAt:   now,
    UpdatedAt:   now,
}
res, err := db.Collection(db.CollChannels).InsertOne(ctx, ch)
ch.ID = res.InsertedID.(bson.ObjectID)

// List:
cursor, err := db.Collection(db.CollChannels).Find(ctx, bson.D{})
var channels []models.Channel
cursor.All(ctx, &channels)
```

### Next.js 16: Server Action for Login
```typescript
// Source: nextjs.org/docs/app/getting-started/updating-data (2026-02-27)
// admin-app/src/app/actions/auth.ts
'use server'
import { redirect } from 'next/navigation'
import { createSession } from '@/lib/session'

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Uses internal Docker DNS — bypasses nginx entirely
  const res = await fetch(`${process.env.ADMIN_API_INTERNAL_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    return { error: 'Invalid credentials' }
  }

  const { token } = await res.json()
  await createSession(token) // sets httpOnly cookie with path: '/'
  redirect('/admin/channels')
}
```

### Next.js 16: useActionState for Login Form
```typescript
// Source: nextjs.org/docs/app/guides/authentication (2026-02-27)
'use client'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="space-y-4">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {state?.error && <p className="text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind config in tailwind.config.ts | @theme CSS blocks in globals.css | Tailwind v4 | Phase 1 already uses v4 pattern |
| getServerSideProps / getStaticProps | App Router Server Components | Next.js 13+ | Admin-app already using App Router |
| pages/middleware.ts | src/middleware.ts (root of src/) | Next.js 13+ | Middleware goes at root of src/ directory |
| useFormStatus (React 18) | useActionState (React 19) | React 19 | Already on React 19.2.3 |
| JWT in localStorage | httpOnly cookie | Security best practice | Must use cookie to prevent XSS |
| jwtauth/v4 | jwtauth/v5 (lestrrat-go/jwx v2) | v5.0.0 | Import path: github.com/go-chi/jwtauth/v5 |

**Deprecated/outdated:**
- `pages/` directory in Next.js: project uses `app/` router — never use pages/
- `primitive.ObjectID` from mongo-driver v1: replaced by `bson.ObjectID` in v2 (Phase 1 decision)
- Running FFmpeg in child process via shell string: use `exec.Command("ffmpeg", args...)` with explicit argument list to avoid shell injection

---

## Open Questions

1. **Admin user seeding approach**
   - What we know: MongoDB init.js runs on first container startup; bcrypt hash must be pre-computed
   - What's unclear: Should the hash be hardcoded in init.js (tied to a plaintext default password) or generated by a seed command that reads env vars?
   - Recommendation: Add `cmd/seed/main.go` that reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars, hashes the password with bcrypt, and upserts the admin user. Run as: `docker compose run --rm admin-api /bin/seed`.

2. **FFmpeg keyframe interval with unknown source fps**
   - What we know: `-g 180 -keyint_min 180` assumes 30fps source. YouTube videos can be 24/25/30/60fps.
   - What's unclear: Should we probe fps with ffprobe before transcoding and compute `-g` dynamically, or use `-force_key_frames "expr:gte(t,n_forced*6)"` as the fps-agnostic alternative?
   - Recommendation: Use `-force_key_frames "expr:gte(t,n_forced*6)"` instead of fixed `-g 180`. This forces a keyframe every 6 seconds regardless of fps. Keep `-sc_threshold 0` to disable scene-cut keyframes.

---

## Critical Infrastructure Changes Required

**1. backend/Dockerfile: Add yt-dlp and ffmpeg to admin-api runtime stage**

Current (Phase 1):
```dockerfile
# Admin API runtime
FROM alpine:3.19 AS admin-api
RUN apk add --no-cache wget
COPY --from=admin-api-build /bin/admin-api /bin/admin-api
ENTRYPOINT ["/bin/admin-api"]
```

Required (Phase 2):
```dockerfile
# Admin API runtime
FROM alpine:3.19 AS admin-api
RUN apk add --no-cache wget ffmpeg python3 py3-pip && \
    pip3 install --no-cache-dir yt-dlp --break-system-packages
COPY --from=admin-api-build /bin/admin-api /bin/admin-api
ENTRYPOINT ["/bin/admin-api"]
```

**2. docker-compose.yml: Add HLS volume and environment vars to admin-api service**

Add to the `admin-api` service block:
```yaml
admin-api:
  # ... existing config ...
  volumes:
    - ./data/hls:/data/hls:rw
  environment:
    MONGO_URI: ${MONGO_URI}
    PORT: "8082"
    HLS_ROOT: "/data/hls"
    JWT_SECRET: "${JWT_SECRET}"
    ADMIN_API_INTERNAL_URL: "http://admin-api:8082"  # For admin-app server actions
```

Also add to `admin-app` service block (for server-side fetch):
```yaml
admin-app:
  # ... existing config ...
  environment:
    ADMIN_API_INTERNAL_URL: "http://admin-api:8082"
```

**3. .env.example: Add new required secrets**
```bash
JWT_SECRET=your-random-256-bit-secret-here
ADMIN_EMAIL=admin@kidtube.local
ADMIN_PASSWORD=change-me-before-production
```

---

## Sources

### Primary (HIGH confidence)
- `https://github.com/go-chi/jwtauth` (v5.4.0, 2026-02-26) — Verifier, Authenticator, TokenFromCookie patterns
- `https://pkg.go.dev/golang.org/x/crypto/bcrypt` — GenerateFromPassword, CompareHashAndPassword, DefaultCost
- `https://nextjs.org/docs/app/guides/authentication` (version 16.1.6, 2026-02-27) — httpOnly cookie session, middleware.ts, jose library, useActionState
- `https://nextjs.org/docs/app/getting-started/updating-data` (version 16.1.6, 2026-02-27) — Server Actions, revalidatePath, redirect
- Phase 1 source files: `backend/go.mod`, `backend/internal/models/*`, `backend/internal/db/mongo.go`, `backend/cmd/admin-api/main.go`, `backend/Dockerfile`, `docker-compose.yml`, `nginx/nginx.conf`, `admin-app/package.json`, `admin-app/next.config.ts`

### Secondary (MEDIUM confidence)
- `https://www.mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg-a-step-by-step-guide` — FFmpeg multi-rendition HLS command (verified against gist and ottverse; flags are consistent)
- `https://gist.github.com/maitrungduc1410/9c640c61a7871390843af00ae1d8758e` — FFmpeg HLS script with per-rendition segment naming, key_frames_interval, VOD playlist
- `https://pkg.go.dev/github.com/lrstanley/go-ytdlp` (v1.3.1, 2026-02-22) — yt-dlp JSON output fields reference (title, description, thumbnail, duration)
- `https://gobyexample.com/worker-pools` — Single-worker goroutine channel pattern

### Tertiary (LOW confidence)
- yt-dlp `--sleep-requests 5` as 429 mitigation: multiple community sources agree, but exact optimal value is environment-dependent. Flag for tuning.
- `--break-system-packages` flag for pip on Alpine: needed on newer pip versions but exact Alpine version behavior should be verified during Docker build.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via pkg.go.dev and official docs; versions confirmed
- Architecture: HIGH — directly derived from existing Phase 1 code structure; all models/collections already exist
- Infrastructure gaps: HIGH — Dockerfile and docker-compose.yml gaps confirmed by reading actual files
- FFmpeg HLS command: MEDIUM — multiple consistent sources but keyframe math for variable fps flagged as open question
- Pitfalls: HIGH — infrastructure gaps verified by reading code; auth cookie path pitfall verified against Next.js docs

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable libraries; FFmpeg and yt-dlp are version-pinned in Docker)
