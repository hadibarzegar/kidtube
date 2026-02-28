# Architecture Research

**Domain:** Kids' educational video-on-demand platform (VOD)
**Researched:** 2026-02-28
**Confidence:** HIGH (stack is fixed by owner; patterns verified against official docs and 2025-2026 sources)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Client Layer                                   │
│  ┌──────────────────────┐        ┌─────────────────────────────┐     │
│  │   site-app (Next.js) │        │  admin-app (Next.js)        │     │
│  │   Port 3000          │        │  Port 3001                  │     │
│  │   App Router, RTL    │        │  App Router, Dashboard UI   │     │
│  └──────────┬───────────┘        └──────────────┬──────────────┘     │
└─────────────┼────────────────────────────────────┼────────────────────┘
              │ HTTPS                              │ HTTPS
┌─────────────▼────────────────────────────────────▼────────────────────┐
│                        nginx (reverse proxy)                           │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Port 80/443                                                   │   │
│  │  Route /api/v1/* → site-api:8080                              │   │
│  │  Route /api/admin/* → admin-api:8081                          │   │
│  │  Route /hls/* → static /data/hls/ (video segments)            │   │
│  │  Route / → site-app:3000                                      │   │
│  │  Route /admin/* → admin-app:3001                              │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────┬──────────────────────────────────┬─────────────────────────────┘
        │                                  │
┌───────▼──────────────┐        ┌──────────▼──────────────────────────────┐
│   Go Backend          │        │  Video Pipeline (async worker)           │
│  ┌────────────────┐  │        │  ┌──────────────────────────────────┐   │
│  │  site-api      │  │        │  │  go-ytdlp → FFmpeg → /data/hls/  │   │
│  │  :8080         │  │        │  │  Triggered by admin-api jobs      │   │
│  │  (cmd/site-api)│  │        │  └──────────────────────────────────┘   │
│  └────────────────┘  │        └─────────────────────────────────────────┘
│  ┌────────────────┐  │
│  │  admin-api     │  │
│  │  :8081         │  │
│  │ (cmd/admin-api)│  │
│  └────────────────┘  │
│  internal/ (shared)  │
└───────────┬───────────┘
            │
┌───────────▼───────────┐
│       MongoDB          │
│       Port 27017       │
│  Collections:          │
│  channels, episodes,   │
│  categories, users,    │
│  jobs                  │
└───────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Notes |
|-----------|---------------|-------|
| `site-app` | Public-facing video browsing, playback, search, user account | Next.js App Router, SSR for SEO, RTL Persian layout |
| `admin-app` | Content management — channels, episodes, job queue, users | Next.js App Router, dashboard-style, same router |
| `site-api` | REST API for public site — video listings, search, auth, subscriptions | Go binary, port 8080 |
| `admin-api` | REST API for admin — CRUD on all entities, video ingestion triggers, job status | Go binary, port 8081 |
| `internal/` | Shared Go packages — DB models, repository layer, config, middleware, auth | Not exported; used by both cmd binaries |
| `nginx` | Reverse proxy for all four services + static file server for HLS segments | Handles CORS, MIME types for m3u8/ts |
| `MongoDB` | Single database for all application data | Separate collections, not separate DBs |
| Video pipeline | Async: yt-dlp download → FFmpeg HLS transcode → write to /data/hls/ | Runs inside admin-api as goroutine worker pool or separate cmd |

---

## Recommended Project Structure

### Go Backend (single repo)

```
kidtube-api/
├── go.mod
├── go.sum
├── cmd/
│   ├── site-api/
│   │   └── main.go          # Wires internal packages, starts HTTP server on :8080
│   └── admin-api/
│       └── main.go          # Wires internal packages, starts HTTP server on :8081
├── internal/
│   ├── config/
│   │   └── config.go        # Env-based config struct (DB URI, ports, HLS path, etc.)
│   ├── db/
│   │   └── mongo.go         # MongoDB client init, connection pooling
│   ├── models/
│   │   ├── channel.go       # Channel struct (BSON tags)
│   │   ├── episode.go       # Episode struct (BSON tags)
│   │   ├── category.go      # Category struct
│   │   ├── user.go          # User struct
│   │   └── job.go           # Transcoding job struct
│   ├── repository/
│   │   ├── channel.go       # Channel CRUD (MongoDB ops)
│   │   ├── episode.go       # Episode CRUD + search
│   │   ├── category.go      # Category CRUD
│   │   ├── user.go          # User CRUD + auth
│   │   └── job.go           # Job queue ops
│   ├── service/
│   │   ├── channel.go       # Business logic for channels
│   │   ├── episode.go       # Business logic for episodes
│   │   ├── auth.go          # JWT auth service (shared by both APIs)
│   │   └── pipeline.go      # yt-dlp + FFmpeg orchestration
│   ├── handler/
│   │   ├── site/            # HTTP handlers for site-api only
│   │   │   ├── video.go
│   │   │   ├── channel.go
│   │   │   ├── search.go
│   │   │   └── auth.go
│   │   └── admin/           # HTTP handlers for admin-api only
│   │       ├── channel.go
│   │       ├── episode.go
│   │       ├── ingest.go    # YouTube URL + file upload handlers
│   │       ├── job.go       # Job status polling
│   │       └── user.go
│   ├── middleware/
│   │   ├── auth.go          # JWT validation middleware
│   │   ├── cors.go          # CORS headers
│   │   └── logger.go        # Request logging
│   └── worker/
│       ├── pool.go          # Goroutine worker pool
│       ├── downloader.go    # go-ytdlp integration
│       └── transcoder.go    # FFmpeg HLS transcoding
└── docker/
    ├── site-api.Dockerfile
    └── admin-api.Dockerfile
```

**Structure rationale:**
- `cmd/` contains minimal `main.go` files that only wire dependencies and start servers — no business logic
- `internal/` enforces that no external package imports these — safe to refactor freely
- `internal/handler/site/` and `internal/handler/admin/` separate HTTP concerns per API
- `internal/service/` and `internal/repository/` are shared across both APIs
- `internal/worker/` handles the async pipeline, called from admin-api at job creation time

### Next.js Apps (two separate apps, not a monorepo)

For this project's scale, two independent Next.js apps are simpler than a Turborepo monorepo. Each has its own `package.json`, `next.config.js`, and Docker image.

```
kidtube-site/
├── package.json
├── next.config.js          # basePath: "" (root), API rewrites to site-api
├── app/
│   ├── layout.tsx          # Root layout: RTL dir, Persian font, global nav
│   ├── page.tsx            # Homepage: featured channels, trending, categories
│   ├── (browse)/
│   │   ├── channels/
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Channel page: episode grid
│   │   └── categories/
│   │       └── [slug]/
│   │           └── page.tsx   # Category page
│   ├── watch/
│   │   └── [episodeId]/
│   │       └── page.tsx    # Video player page (SSR for metadata, Client for player)
│   ├── search/
│   │   └── page.tsx        # Search results (Server Component with searchParams)
│   └── account/
│       ├── login/
│       └── bookmarks/
├── components/
│   ├── player/
│   │   └── VideoPlayer.tsx # 'use client' — HLS.js player
│   ├── cards/
│   │   ├── EpisodeCard.tsx
│   │   └── ChannelCard.tsx
│   └── layout/
│       ├── Header.tsx
│       └── CategoryNav.tsx
└── lib/
    ├── api.ts              # Typed fetch wrappers for site-api
    └── types.ts            # Shared TypeScript interfaces

kidtube-admin/
├── package.json
├── next.config.js          # basePath: "/admin"
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # Dashboard overview
│   ├── channels/
│   │   ├── page.tsx        # Channel list
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx    # Channel edit
│   │       └── episodes/
│   │           ├── page.tsx
│   │           └── new/page.tsx  # Episode create + YouTube URL ingest
│   ├── jobs/
│   │   └── page.tsx        # Job queue status (polling or Server-Sent Events)
│   └── users/
│       └── page.tsx
├── components/
│   ├── forms/
│   └── tables/
└── lib/
    ├── api.ts
    └── types.ts
```

### Docker Compose (root level)

```
docker-compose.yml
├── nginx          # Port 80 exposed; reverse proxy + HLS static serving
├── site-api       # Go binary; port 8080 internal
├── admin-api      # Go binary; port 8081 internal
├── site-app       # Next.js; port 3000 internal
├── admin-app      # Next.js; port 3001 internal
└── mongo          # Port 27017 internal; volume for persistence

volumes:
└── hls-data       # Shared volume between admin-api (writer) and nginx (reader)
```

---

## MongoDB Schema Design

### Collection: `channels`

```javascript
{
  _id: ObjectId,
  slug: "math-with-ali",          // unique, URL-safe
  name: "ریاضی با علی",
  description: "string",
  thumbnail_url: "string",        // stored path or URL
  category_ids: [ObjectId],       // references to categories
  age_groups: ["toddler", "kids"], // enum: toddler (2-5), kids (6-10)
  episode_count: 42,              // denormalized counter
  is_published: true,
  created_at: Date,
  updated_at: Date
}
```

Indexes: `slug` (unique), `category_ids`, `age_groups`, `is_published`

### Collection: `episodes`

```javascript
{
  _id: ObjectId,
  channel_id: ObjectId,           // reference (not embedded — episodes queried independently)
  title: "جمع و تفریق — قسمت ۱",
  description: "string",
  youtube_url: "string",          // original source URL (optional, for record-keeping)
  thumbnail_path: "/thumbnails/abc123.jpg",
  hls_path: "/hls/abc123/master.m3u8",  // relative path served by nginx
  duration_seconds: 480,
  subtitles: [
    { lang: "fa", path: "/subtitles/abc123_fa.vtt" }
  ],
  quality_levels: ["360p", "720p", "1080p"],
  status: "ready",                // enum: pending | processing | ready | failed
  sort_order: 1,                  // within channel
  is_published: true,
  created_at: Date,
  updated_at: Date
}
```

Indexes: `channel_id`, `status`, `is_published`, `sort_order`, text index on `title` + `description` for search

### Collection: `categories`

```javascript
{
  _id: ObjectId,
  slug: "math",
  name: "ریاضی",
  icon: "string",                 // emoji or icon name
  sort_order: 1,
  is_active: true
}
```

Small, mostly static. Embed in channel reads via `$lookup` or cache in-memory.

### Collection: `users`

```javascript
{
  _id: ObjectId,
  email: "string",                // unique
  password_hash: "string",
  subscribed_channel_ids: [ObjectId],  // array of refs — bounded, users won't sub to 10k channels
  bookmarked_episode_ids: [ObjectId],  // array of refs — bounded similarly
  role: "user",                   // enum: user | admin
  created_at: Date,
  last_login_at: Date
}
```

Embedding `subscribed_channel_ids` and `bookmarked_episode_ids` as arrays of references is correct here — these are bounded lists, frequently accessed with the user document, and won't exceed MongoDB's 16MB document limit.

### Collection: `jobs`

```javascript
{
  _id: ObjectId,
  episode_id: ObjectId,           // the episode being created
  type: "youtube_import",         // enum: youtube_import | file_upload
  youtube_url: "string",          // input for youtube_import jobs
  status: "pending",              // enum: pending | downloading | transcoding | done | failed
  error_message: "string",        // set on failure
  progress_pct: 65,               // 0-100
  created_at: Date,
  updated_at: Date
}
```

Jobs are short-lived records — no long-term storage needed. TTL index on `created_at` (e.g., delete after 30 days).

**Schema design rationale:**
- Episodes reference channels (not embedded) because episodes are queried independently (by status, for search, per channel list)
- Channel `episode_count` is denormalized to avoid expensive COUNT queries on every channel card render
- User subscriptions/bookmarks are embedded as ID arrays (not a junction collection) because the lists are bounded and accessed atomically with the user
- Job collection decouples ingestion status from the episode record

---

## Architectural Patterns

### Pattern 1: Shared Internal Packages, Two cmd Binaries

**What:** All business logic, data access, and pipeline code lives in `internal/`. Both `cmd/site-api/main.go` and `cmd/admin-api/main.go` import from `internal/` and compose different subsets of handlers and middleware.

**When to use:** When two services share domain models and database access but serve different audiences with different auth requirements (public read-only vs admin write). This avoids duplication without microservice overhead.

**Trade-offs:** Both binaries deploy as separate containers with separate resource limits. Admin-api can be crashed or restarted without affecting site-api. Code duplication is eliminated via shared internal packages.

**Example:**
```go
// cmd/site-api/main.go
func main() {
    cfg := config.Load()
    db := db.Connect(cfg.MongoURI)

    channelRepo := repository.NewChannelRepo(db)
    episodeRepo := repository.NewEpisodeRepo(db)
    authService  := service.NewAuthService(db, cfg.JWTSecret)

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.CORS(cfg.SiteOrigin))
    r.Mount("/api/v1", handler.SiteRoutes(channelRepo, episodeRepo, authService))
    http.ListenAndServe(":8080", r)
}

// cmd/admin-api/main.go
func main() {
    cfg := config.Load()
    db := db.Connect(cfg.MongoURI)

    // Same repos, same services — but different handlers and worker
    workerPool := worker.NewPool(cfg.HLSOutputPath, cfg.Workers)
    r := chi.NewRouter()
    r.Use(middleware.AdminAuth(cfg.JWTSecret)) // All routes require admin role
    r.Mount("/api/admin", handler.AdminRoutes(/* all repos */, workerPool))
    http.ListenAndServe(":8081", r)
}
```

### Pattern 2: Video Ingestion as Async Worker Pool

**What:** Admin submits a YouTube URL or file. Admin-api writes a `job` document (status=pending) and returns 202 Accepted immediately. A goroutine worker pool picks up the job, calls yt-dlp to download, then FFmpeg to transcode to HLS, then updates the job and episode status to ready.

**When to use:** Any operation that takes longer than a few seconds must be async in a web API. Video download + transcoding can take minutes. Blocking the HTTP request is not acceptable.

**Trade-offs:** Requires job status polling or SSE on the admin UI. Simpler than adding a dedicated queue (Redis/RabbitMQ) — goroutine pool backed by a MongoDB jobs collection is sufficient for a single-server deployment.

**Example:**
```go
// internal/worker/pool.go
type Pool struct {
    jobs    chan ObjectID     // buffered channel of job IDs
    workers int
    hlsPath string
}

func (p *Pool) Submit(jobID ObjectID) {
    p.jobs <- jobID
}

func (p *Pool) Start(ctx context.Context, jobRepo *repository.JobRepo, episodeRepo *repository.EpisodeRepo) {
    for i := 0; i < p.workers; i++ {
        go func() {
            for jobID := range p.jobs {
                p.process(ctx, jobID, jobRepo, episodeRepo)
            }
        }()
    }
}
```

### Pattern 3: Next.js Server Components for Data Fetching

**What:** Page components (`page.tsx`) are Server Components by default. They fetch data directly from the Go API (server-to-server, no browser involvement). Only interactive elements (the video player, search input, bookmark button) are Client Components with `'use client'`.

**When to use:** Always in App Router. Server Components render HTML on the server — no client JS bundle cost, no loading spinners for content. Persian text, channel grids, episode lists — all rendered server-side.

**Trade-offs:** The video player must be a Client Component (uses HLS.js, browser APIs). Wrap it in Suspense to avoid blocking the page render.

**Example:**
```typescript
// app/watch/[episodeId]/page.tsx — Server Component
export default async function WatchPage({ params }: { params: { episodeId: string } }) {
  const episode = await fetchEpisode(params.episodeId); // server-side fetch to Go API
  return (
    <main>
      <h1>{episode.title}</h1>
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <VideoPlayer hlsUrl={episode.hlsUrl} subtitles={episode.subtitles} />
      </Suspense>
      <EpisodeInfo episode={episode} />
    </main>
  );
}

// components/player/VideoPlayer.tsx — Client Component
'use client';
import Hls from 'hls.js';
```

### Pattern 4: nginx as Single Ingress + HLS Static Server

**What:** nginx is the only publicly exposed service. It handles TLS termination, routes `/api/v1/*` and `/api/admin/*` to Go binaries, routes `/hls/*` to the local HLS segment directory, and proxies `/` and `/admin/*` to Next.js apps. The Go APIs and Next.js apps are on an internal Docker network only.

**When to use:** Always on single-server Docker Compose deployments. Simplifies TLS, eliminates CORS issues (same origin for everything), and allows zero-cost static HLS serving without involving Go.

**Trade-offs:** nginx must have the `hls-data` volume mounted read-only. The Go worker writes to the same volume. On a single server this is a bind mount or named volume — both work.

**nginx location config (key sections):**
```nginx
# HLS segments — static files, long cache headers
location /hls/ {
    root /data;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Content-Type application/vnd.apple.mpegurl;  # for .m3u8
    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
    }
    add_header Access-Control-Allow-Origin *;
}

# Go site API
location /api/v1/ {
    proxy_pass http://site-api:8080;
}

# Go admin API
location /api/admin/ {
    proxy_pass http://admin-api:8081;
}

# Next.js site
location / {
    proxy_pass http://site-app:3000;
}
```

---

## Data Flow

### Flow 1: Public Video Playback

```
Browser
  → HTTPS GET /watch/ep123 → nginx
  → nginx → site-app:3000 (Next.js SSR)
  → site-app fetches GET http://site-api:8080/api/v1/episodes/ep123
  → site-api queries MongoDB episodes collection
  → MongoDB returns episode doc (with hls_path)
  → site-app renders HTML with VideoPlayer client component
  → Browser loads page, VideoPlayer boots HLS.js
  → HLS.js fetches /hls/abc123/master.m3u8 → nginx → /data/hls/abc123/master.m3u8 (static)
  → HLS.js fetches segments → nginx → static .ts files
```

### Flow 2: Admin YouTube Import

```
Admin browser
  → POST /api/admin/episodes/ingest { youtube_url: "..." }
  → nginx → admin-api:8081
  → admin-api creates episode doc (status=pending)
  → admin-api creates job doc (status=pending)
  → admin-api submits jobID to worker pool channel
  → admin-api returns 202 { jobId: "..." }

Worker goroutine (async):
  → Reads jobID from channel
  → Updates job status=downloading
  → go-ytdlp downloads video to /tmp/abc123.mp4
  → Updates job status=transcoding
  → FFmpeg transcodes to /data/hls/abc123/{master.m3u8, stream_0/, stream_1/, stream_2/}
  → Updates episode status=ready, episode hls_path
  → Updates job status=done
  → Deletes /tmp/abc123.mp4

Admin browser (polling job status):
  → GET /api/admin/jobs/jobId → job.status=done
  → Redirect to episode edit page
```

### Flow 3: Search

```
Browser
  → GET /search?q=ریاضی → nginx → site-app
  → site-app (Server Component) fetches GET /api/v1/search?q=ریاضی
  → site-api: MongoDB $text search on episodes.title + episodes.description
  → Returns episode list (with channel info via $lookup)
  → site-app renders search results page server-side
  → Browser receives pre-rendered HTML (no client-side fetch spinner)
```

### Flow 4: Auth Flow

```
Browser POST /api/v1/auth/login → site-api
  → site-api validates credentials against MongoDB users
  → Issues JWT (HttpOnly cookie, SameSite=Strict)
  → Subsequent requests carry cookie automatically
  → site-api middleware validates JWT, attaches user to context
  → Admin routes in admin-api use same JWT secret, check role=admin claim
```

---

## Suggested Build Order (Dependencies)

The component dependency graph drives phase ordering:

```
1. MongoDB schema + Go models         ← foundation; everything depends on this
2. Go internal/ packages              ← repository, config, db connection
3. site-api + admin-api binaries      ← need models and repos first
4. Docker Compose skeleton            ← need Go images; nginx config
5. Video pipeline (worker)            ← needs admin-api, needs nginx HLS path
6. site-app (Next.js)                 ← needs site-api to exist for data
7. admin-app (Next.js)                ← needs admin-api
8. Auth + user accounts               ← layered on top of working site
```

**Phase implications:**
- Phase 1 (Foundation): Go project scaffold + MongoDB schema + Docker Compose skeleton. No features, just "everything runs and connects."
- Phase 2 (Read path): site-api channels/episodes endpoints + site-app browsing UI. Manually seeded data. No ingestion yet.
- Phase 3 (Video pipeline): yt-dlp + FFmpeg worker + admin-api ingest endpoints. Admin-app minimal ingest UI.
- Phase 4 (Admin CRUD): Full admin-app with channel/episode/category management UI.
- Phase 5 (Auth + accounts): User registration, login, subscriptions, bookmarks.
- Phase 6 (Polish): Search, age filtering, featured/trending, RTL polish.

---

## Scaling Considerations

| Concern | At 100 users | At 10K users | At 100K users |
|---------|--------------|--------------|---------------|
| Video bandwidth | nginx static serving fine | nginx + local disk fine; watch I/O throughput | Move HLS to CDN/object storage; nginx as origin |
| API throughput | Single Go binary handles thousands req/s easily | Still fine; Go is highly concurrent | Horizontal scale Go pods, add load balancer |
| MongoDB reads | Default connection pool (100 conns) | Add read replicas; index all query paths | Sharding (unlikely needed for VOD platform) |
| Transcoding | Sequential worker pool (1-3 workers) | Increase workers; watch CPU saturation | Offload transcoding to separate server/service |
| Disk space | Local bind mount fine | Monitor disk; rotate old quality levels | Object storage with lifecycle policies |

**First bottleneck:** Disk I/O and bandwidth for HLS segments, not application code. A VOD platform under moderate load is overwhelmingly a file-serving problem, which nginx handles efficiently.

---

## Anti-Patterns

### Anti-Pattern 1: Storing HLS Segments in MongoDB (GridFS)

**What people do:** Use MongoDB GridFS to store video segments alongside the application data.

**Why it's wrong:** GridFS is designed for large binary blobs but adds unnecessary overhead for a file-serving use case. nginx serves static files orders of magnitude faster than any application-level file serving. HLS segments are immutable once written — they gain nothing from a database.

**Do this instead:** Write segments to a local directory (e.g., `/data/hls/`). nginx serves them directly as static files with aggressive caching headers. No application server in the path for video bytes.

### Anti-Pattern 2: Blocking HTTP Handler on Transcoding

**What people do:** Start FFmpeg in the admin-api HTTP handler and wait for it to finish before returning.

**Why it's wrong:** Transcoding a 20-minute video can take 5-10 minutes. The HTTP connection will time out. nginx will give a 504. The admin thinks the import failed. The file may be half-written.

**Do this instead:** Accept the job (write to MongoDB jobs collection), submit to a worker pool goroutine channel, return 202 Accepted with a job ID immediately. Admin UI polls the job status endpoint.

### Anti-Pattern 3: Embedding Episodes Inside Channel Documents

**What people do:** Store episodes as an array inside the channel MongoDB document.

**Why it's wrong:** A channel with 100 episodes at ~1KB metadata each = 100KB per channel document. MongoDB's 16MB limit isn't the only concern — reading a channel document to display its thumbnail on the homepage fetches all 100 episodes needlessly. Episode queries (by status, for search, for job tracking) require querying across channels.

**Do this instead:** Episodes are a separate collection with a `channel_id` reference. Use `$lookup` when you need channel metadata with episodes, or query episodes independently. Denormalize `episode_count` on the channel document to avoid COUNT queries.

### Anti-Pattern 4: Client Component by Default in Next.js

**What people do:** Add `'use client'` to all components because it "works everywhere."

**Why it's wrong:** Client Components ship JavaScript to the browser. A Persian channel grid with 20 cards, each rendered in the browser from an API call, means: a loading spinner, extra network roundtrip, hydration work, and no SEO.

**Do this instead:** All page-level components and data-fetching are Server Components. Only add `'use client'` to components that use browser APIs (HLS.js player, scroll handlers) or React state/effects. Wrap interactive islands in Suspense.

### Anti-Pattern 5: Separate MongoDB Databases for site-api and admin-api

**What people do:** Give each API its own database to enforce separation.

**Why it's wrong:** Both APIs access the same domain data (channels, episodes, users). Separate databases means cross-database queries are impossible, and you'd need to duplicate or sync data. A single-server deployment has no isolation benefit from separate databases.

**Do this instead:** One MongoDB database, same collections. Separation is enforced at the API layer (admin-api has write access to all collections; site-api only reads most collections). The `users` collection requires different access patterns from both APIs — one DB handles this cleanly.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| YouTube (yt-dlp) | `github.com/lrstanley/go-ytdlp` Go library, called from worker goroutine | Auto-installs yt-dlp binary; wraps subprocess cleanly; builder pattern API |
| FFmpeg | `exec.CommandContext` shell subprocess from `internal/worker/transcoder.go` | Standard approach; no Go FFmpeg library matches CLI flexibility |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| nginx ↔ site-app | HTTP proxy (Docker network) | site-app exposes :3000 |
| nginx ↔ admin-app | HTTP proxy (Docker network) | admin-app exposes :3001 |
| nginx ↔ site-api | HTTP proxy (Docker network) | site-api exposes :8080 |
| nginx ↔ admin-api | HTTP proxy (Docker network) | admin-api exposes :8081 |
| nginx ↔ HLS files | Shared Docker volume (read-only for nginx) | `hls-data` volume |
| admin-api ↔ HLS files | Shared Docker volume (read-write for worker) | Same `hls-data` volume |
| site-app ↔ site-api | HTTP fetch (server-to-server, same Docker network) | From Next.js Server Components |
| admin-app ↔ admin-api | HTTP fetch (server-to-server) | From Next.js Server Components |
| site-api ↔ MongoDB | `go.mongodb.org/mongo-driver` (single shared client, connection pool) | One client per process, reused |
| admin-api ↔ MongoDB | Same driver, separate process | Same DB, different collections access pattern |
| admin-api worker ↔ job channel | Go buffered channel | In-process, no external queue needed |

---

## Sources

- Go official module layout documentation: [go.dev/doc/modules/layout](https://go.dev/doc/modules/layout) — HIGH confidence
- golang-standards/project-layout: [github.com/golang-standards/project-layout](https://github.com/golang-standards/project-layout) — MEDIUM confidence (community, not official standard, but widely adopted)
- go-ytdlp Go library: [pkg.go.dev/github.com/lrstanley/go-ytdlp](https://pkg.go.dev/github.com/lrstanley/go-ytdlp) — HIGH confidence (official pkg.go.dev listing)
- Next.js App Router architecture: [nextjs.org/docs/architecture](https://nextjs.org/docs/architecture) — HIGH confidence (official docs, updated 2026-02-27)
- Next.js server-first architecture patterns: [yogijs.tech/blog/nextjs-project-architecture-app-router](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) — MEDIUM confidence (community article, 2026)
- FFmpeg HLS multi-quality transcode: [mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg](https://www.mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg-a-step-by-step-guide) — HIGH confidence (Mux, authoritative video infrastructure company)
- nginx HLS static file serving: [gist.github.com/mrbar42/09c149059f72da2f09e652d4c5079919](https://gist.github.com/mrbar42/09c149059f72da2f09e652d4c5079919) — MEDIUM confidence (widely referenced community gist)
- MongoDB embedding vs references: [mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references](https://www.mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references/) — HIGH confidence (official MongoDB docs)
- MongoDB Go driver connection pooling: [mongodb.com/docs/drivers/go/current/connect/connection-options/connection-pools](https://www.mongodb.com/docs/drivers/go/current/connect/connection-options/connection-pools/) — HIGH confidence (official MongoDB docs)
- Go background job processing patterns: [oneuptime.com/blog/post/2026-01-30-go-background-job-processing](https://oneuptime.com/blog/post/2026-01-30-go-background-job-processing/view) — LOW confidence (single source, verify patterns against official Go docs)
- HLS protocol deep dive 2025: [m3u8-player.net/blog/deep-dive-hls-protocol-architecture](https://m3u8-player.net/blog/deep-dive-hls-protocol-architecture/) — MEDIUM confidence (technical blog, 2025)

---

*Architecture research for: KidTube — Persian kids' educational VOD platform*
*Researched: 2026-02-28*
