# Stack Research

**Domain:** Kids' educational video VOD platform (Persian/RTL, Go + MongoDB + Next.js)
**Researched:** 2026-02-28
**Confidence:** HIGH (verified with official docs and pkg.go.dev for all core choices)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Go | 1.26 | Backend API + transcoding worker | Latest stable (released Feb 10 2026). Go is chosen by project owner. Use 1.26 to get the latest tooling and match Gin v1.12 requirements. |
| Gin | v1.12.0 | HTTP router/framework for Go APIs | Most widely adopted Go web framework (~48% of Go devs). 81k+ stars. Requires Go 1.24+. Mature, battle-tested, excellent middleware ecosystem. Ideal for REST APIs. |
| MongoDB Go Driver | v2.5.0 (go.mongodb.org/mongo-driver/v2) | Database driver | Official driver, v2 is the actively maintained branch. v1.x is in maintenance-only mode. No ODM needed — the native driver is idiomatic Go and avoids hidden magic. |
| Next.js | 16 (latest via `npm install next@latest`) | Frontend for site + admin panel | Next.js 16 is stable (released Oct 21 2025). App Router is the current paradigm. Turbopack is the default bundler. React 19.2 included. Requires Node.js 20.9+. |
| React | 19.2 (bundled with Next.js 16) | UI framework | Comes with Next.js 16. React Compiler (stable in Next.js 16) reduces re-renders automatically. |
| MongoDB | 8.x (latest) | Primary database | Chosen by project owner. Stores channels, episodes, categories, users, subscriptions. Flexible document model fits the content schema well. |
| nginx | 1.27 (alpine) | Static file server for HLS segments | Serves `.m3u8` playlists and `.ts`/`.fmp4` segments. Add CORS headers for HLS MIME types. Acts as reverse proxy in front of Go APIs and Next.js. |

### Supporting Libraries — Go Backend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| golang-jwt/jwt | v5.3.0 | JWT token creation and parsing | Admin authentication. Use directly rather than wrapping middleware for more control. |
| spf13/viper | v1.x (latest) | Config from env + config files | Loading MongoDB URI, JWT secret, FFmpeg paths from environment variables and config files. |
| go.uber.org/zap | v1.x (latest) | Structured logging | Production logging for both site-api and admin-api. slog is sufficient for simple projects but zap gives better performance and more context fields for async video pipeline logging. |
| lrstanley/go-ytdlp | v1.3.1 | Go CLI bindings for yt-dlp | Invoking yt-dlp from Go for YouTube URL ingestion. Handles binary auto-install, progress callbacks, type-safe builder pattern. |
| google/uuid | v1.x | UUID generation | Generating stable IDs for HLS job tracking, episode IDs. |
| go-playground/validator | v10.x | Request validation | Validating incoming API payloads (episode metadata, user registration). |

### Supporting Libraries — Next.js Frontend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | v4.x | Utility-first CSS | Primary styling. v4 has built-in logical properties for RTL (use `ms-`, `me-`, `ps-`, `pe-` instead of `ml-`/`mr-`). |
| shadcn/ui | latest (canary for Tailwind v4) | Component library | Admin panel UI components (tables, forms, dialogs). shadcn is fully compatible with React 19 and Tailwind v4. |
| Video.js | v8.23.4 | Video player | Plays HLS `.m3u8` files. Bundles videojs-http-streaming (VHS) — no separate hls.js dependency needed. Supports fully custom CSS skins for kid-friendly UI. |
| hls.js | v1.x | HLS playback fallback | Only if building a completely custom player without Video.js wrapper. If using Video.js, skip this — VHS handles it. |
| next/font | (built into Next.js) | Persian font loading | Load Vazirmatn (the standard Persian web font) via next/font for optimized font delivery with zero layout shift. |
| SWR or TanStack Query | v2.x / v5.x | Data fetching + caching | Client-side data fetching on the public site (episode lists, channels). SWR is simpler; TanStack Query better for admin panel with complex mutations. |
| react-hook-form | v7.x | Form state management | Admin panel forms (episode upload, channel creation). Pairs well with shadcn/ui form components. |
| zod | v3.x | Schema validation | Validates form data on the frontend. Use with react-hook-form via `@hookform/resolvers`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| FFmpeg 7.x | Video transcoding to HLS | Run inside the Go worker via `exec.Command`. Use `-hls_segment_type fmp4` for modern fMP4 segments. Keyframe-align all renditions. |
| yt-dlp 2026.02.21 | YouTube video download | Managed via `lrstanley/go-ytdlp` which can auto-download the binary. Pin the yt-dlp version in Docker to avoid breaking changes. |
| Docker Compose v2 | Local and production orchestration | Single `compose.yaml` (Compose v2 format). Services: `mongo`, `go-api`, `site`, `admin`, `nginx`, `transcoder` (or `go-api` handles transcoding async). |
| Air | Hot reload for Go dev | `github.com/air-verse/air` — restarts Go server on file changes during development. |
| Task (Taskfile) | Build task runner | `taskfile.dev` — replaces Makefile for `build`, `test`, `lint`, `docker:up` commands. More readable than Makefile. |
| golangci-lint | Go linting | Run in CI and pre-commit hooks. Include `revive`, `errcheck`, `govet`. |
| ESLint + Biome | Frontend linting | Next.js 16 dropped `next lint` as a build step. Use Biome for fast formatting, ESLint for rules. |

---

## Installation

### Go Backend

```bash
# In the Go project root
go get gin-gonic/gin@v1.12.0
go get go.mongodb.org/mongo-driver/v2/mongo
go get github.com/golang-jwt/jwt/v5
go get github.com/spf13/viper
go get go.uber.org/zap
go get github.com/lrstanley/go-ytdlp
go get github.com/google/uuid
go get github.com/go-playground/validator/v10
```

### Next.js Site Frontend

```bash
# Create the site app (public-facing)
npx create-next-app@latest site --typescript --tailwind --app --eslint

# Install dependencies
npm install video.js @types/video.js
npm install swr
npm install react-hook-form zod @hookform/resolvers
```

### Next.js Admin Frontend

```bash
# Create the admin app
npx create-next-app@latest admin --typescript --tailwind --app --eslint

# Install shadcn/ui (use canary for Tailwind v4)
npx shadcn@latest init

# Install admin-specific dependencies
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Gin | Echo | Echo is equally good (similar performance, slightly different API style). Choose Echo if you prefer explicit error returns over Gin's panic-based approach. Either works fine for this project. |
| Gin | Fiber | Fiber's fasthttp base breaks compatibility with standard `net/http` middleware. Avoid unless raw throughput is the singular priority. |
| Gin | Chi | Chi is excellent but more minimal — no built-in binding or validation helpers. Better for projects that want a pure router only. Gin's batteries are useful here. |
| mongo-driver v2 | mgm ODM | mgm adds CreatedAt/UpdatedAt and FindByID helpers but hides query behavior. For a small team, the native driver gives full visibility. The boilerplate saved by mgm is minimal. |
| Video.js | Plyr | Plyr is prettier out of the box but relies on browser-native HLS (Safari only) without hls.js integration. Requires more setup for adaptive bitrate. Video.js VHS handles this automatically. |
| Video.js | Vidstack | Vidstack is the modern alternative with better React integration but its React package (`@vidstack/react`) had React 19 compatibility issues as late as Feb 2025 (issue #1608). Stick with Video.js until Vidstack releases a stable React 19-compatible version. |
| Tailwind v4 + shadcn | Chakra UI | Chakra has good RTL support but adds significant bundle size and less design flexibility. Tailwind + shadcn gives full control over kid-friendly visual design. |
| zap | slog (stdlib) | slog is fine for simple projects. zap is recommended here because the transcoding pipeline generates a lot of concurrent log events — zap's structured fields and performance advantage matter more in an async worker context. |
| go-ytdlp | exec.Command (raw) | Raw subprocess works but you manage argument escaping, binary paths, and output parsing yourself. go-ytdlp gives typed builder API, auto-install, and progress callbacks with minimal overhead. |
| next/font (Vazirmatn) | Google Fonts CDN | next/font downloads fonts at build time and self-hosts them, avoiding external DNS lookup on load and preventing font-related CLS. Use it. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| mongo-driver v1 (go.mongodb.org/mongo-driver) | v1.17.0 is the last planned v1 release. No new features, maintenance-only. | mongo-driver v2 (`go.mongodb.org/mongo-driver/v2`) |
| Fiber framework | Built on fasthttp, not net/http. Breaks compatibility with most standard Go middleware. Not worth the tradeoff for a REST API. | Gin |
| react-player | Doesn't support HLS natively — requires hls.js as a peer. Less control over player UI. Marketed as a multi-platform wrapper, not a production player. | Video.js with VHS |
| video-react | Unmaintained. Last npm release was years ago. | Video.js |
| JWT in cookies without HttpOnly flag | Exposes auth token to XSS attacks in a kids platform. | Set JWT in HttpOnly cookies or use a proper session mechanism |
| Pages Router (Next.js) | Deprecated path. App Router is the current paradigm and required for Server Components and Cache Components in Next.js 16. | App Router only |
| next/legacy/image | Deprecated in Next.js 16 and will be removed. | next/image |
| middleware.ts (Next.js) | Deprecated in Next.js 16 in favor of proxy.ts. | proxy.ts |
| Webpack in Next.js 16 | Turbopack is now the default. Only use Webpack if you have specific plugin requirements that Turbopack doesn't support yet. | Turbopack (default) |
| RTMP-based nginx for HLS | Designed for live streaming, not VOD. Adds nginx-rtmp-module complexity. For pre-transcoded VOD segments, plain nginx with `alias` directives is simpler and more reliable. | nginx with static file serving + correct MIME types |

---

## Stack Patterns by Variant

**If adding Persian subtitle (.vtt) support:**
- Use Video.js built-in `<track>` support — it handles WebVTT natively
- Store `.vtt` files alongside HLS segments in the same nginx-served directory
- Add subtitle track via the Video.js `options.tracks` config

**If transcoding volume grows and blocks the API:**
- Extract transcoding into a separate `cmd/worker` entrypoint within the same Go project
- Use a simple MongoDB-backed job queue (poll a `jobs` collection)
- Do NOT introduce Redis/RabbitMQ in v1 — MongoDB polling is sufficient for low-to-medium volume

**If video count grows beyond ~10,000 episodes:**
- Add MongoDB Atlas Search or a simple text index on title/description fields
- Continue using MongoDB — no need to introduce Elasticsearch for this scale

**If deploying to multiple servers later:**
- Replace nginx static file serving with an object storage (S3-compatible MinIO)
- Keep the same HLS URL structure — only the storage backend changes

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16 | Node.js 20.9+ | Node.js 18 support dropped in Next.js 16 |
| Next.js 16 | React 19.2 | Bundled automatically |
| shadcn/ui (canary) | Tailwind v4 + React 19 | Use `npx shadcn@latest` for v4 support |
| Video.js 8.23 | React 19 | Use as imperative instance inside useEffect — no React wrapper issues |
| Gin v1.12 | Go 1.24+ | Minimum Go 1.24 required |
| mongo-driver v2.5.0 | Go 1.19+ / MongoDB 4.2+ | v2 is the current stable branch |
| lrstanley/go-ytdlp v1.3.1 | yt-dlp 2026.02.21 | Manages binary download automatically |
| golang-jwt/jwt v5.3.0 | Go 1.19+ | v5 is the actively maintained major version |

---

## Docker Compose Service Map

```yaml
# compose.yaml — service responsibilities
services:
  mongo:        # MongoDB 8.x — data store
  go-api:       # Go 1.26 — site API + admin API (separate route groups)
  site:         # Next.js 16 — public-facing site
  admin:        # Next.js 16 — admin panel
  nginx:        # nginx 1.27-alpine — reverse proxy + HLS static file serving
  # Note: transcoding runs as goroutines within go-api in v1
  # Extract to go-worker service if transcoding queue grows
```

**Volume strategy:**
- `hls_data` volume shared between `go-api` (writes) and `nginx` (reads)
- `mongo_data` volume for MongoDB persistence
- All services on a single `app_network` bridge network

---

## Sources

- [Go Release History](https://go.dev/doc/devel/release) — Go 1.26 confirmed as latest stable (Feb 10, 2026)
- [Gin v1.12.0 Releases](https://github.com/gin-gonic/gin/releases) — Latest Gin, requires Go 1.24+
- [mongo-driver v2 on pkg.go.dev](https://pkg.go.dev/go.mongodb.org/mongo-driver/v2) — v2.5.0, January 28, 2026
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) — Stable release October 21, 2025; Node.js 20.9+ required
- [Video.js Releases](https://github.com/videojs/video.js/releases) — v8.23.4, August 1, 2025 (latest stable)
- [Vidstack React 19 issue](https://github.com/vidstack/player/issues/1608) — React 19 compatibility problem as of early 2025 (LOW confidence it's fully resolved for stable)
- [golang-jwt v5 on pkg.go.dev](https://pkg.go.dev/github.com/golang-jwt/jwt/v5) — v5.3.0, July 30, 2025
- [go-ytdlp on pkg.go.dev](https://pkg.go.dev/github.com/lrstanley/go-ytdlp) — v1.3.1, February 22, 2026
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — Full Tailwind v4 + React 19 compatibility confirmed
- [Tailwind CSS RTL docs](https://tailwindcss.com/blog/tailwindcss-v4) — Logical properties for RTL in v4
- WebSearch: Go framework comparison 2025-2026 (MEDIUM confidence — corroborated by JetBrains Go survey results)
- WebSearch: FFmpeg 7 HLS best practices 2025 (MEDIUM confidence — multiple consistent sources)
- WebSearch: Docker Compose patterns for Go/Next.js/MongoDB (MEDIUM confidence — well-established community patterns)

---

*Stack research for: KidTube — Persian kids' educational video VOD platform*
*Researched: 2026-02-28*
