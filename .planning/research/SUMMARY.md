# Project Research Summary

**Project:** KidTube
**Domain:** Persian-language kids' educational video-on-demand platform
**Researched:** 2026-02-28 / 2026-03-01
**Confidence:** HIGH

## Executive Summary

KidTube is a curated-only, self-hosted VOD platform for Persian-speaking families. The product succeeds or fails on three fundamentals: a reliable HLS transcoding pipeline to get content in, a smooth RTL-Persian-first browsing and playback experience, and a safe-by-design content model (no algorithm, no UGC, no external links). Research confirms this category is well-understood — YouTube Kids, Khan Academy Kids, and Sensical have established the patterns — but no competitor serves Persian natively, which is the clearest differentiator.

The stack (Go + MongoDB + Next.js) is non-negotiable and well-suited to the problem. The recommended approach is to build infrastructure-first: stand up the Go backend, MongoDB schema, Docker Compose network, and nginx HLS serving before touching any UI. Content pipeline (yt-dlp + FFmpeg worker) comes second because nothing else matters if videos cannot be ingested. Public browsing and playback come third. User accounts, bookmarks, and subscriptions are deferred until after the core viewing loop validates.

The most consequential risks are the video pipeline (yt-dlp rate limiting, FFmpeg keyframe misalignment, goroutine leaks) and the RTL foundation (retrofitting RTL is painful; it must be established on day one via `dir="rtl"` and CSS logical properties). Both are fully preventable with the patterns documented in PITFALLS.md. MongoDB Go driver v2 has breaking behavior changes from v1 that will cause silent runtime panics if not accounted for during data layer construction.

---

## Key Findings

### Recommended Stack

The project uses fixed choices for the core triad. All libraries are current stable versions verified against official registries. Key version constraints: Go 1.26 (requires Gin 1.12, mongo-driver v2.5), Next.js 16 (requires Node 20.9+, includes React 19.2), Tailwind v4 (use shadcn canary for compatibility). Video.js 8.23 is preferred over Vidstack due to unresolved React 19 compatibility issues in the latter.

| Technology | Version | Purpose |
|------------|---------|---------|
| Go | 1.26 | Backend APIs + transcoding worker |
| Gin | v1.12 | HTTP routing for site-api and admin-api |
| mongo-driver | v2.5.0 | MongoDB access — v2 only, v1 is EOL |
| Next.js | 16 | Public site + admin panel (App Router only) |
| Tailwind CSS | v4 | Styling — logical properties for RTL built in |
| Video.js | 8.23 | HLS playback — VHS bundled, no hls.js needed separately |
| nginx | 1.27-alpine | Reverse proxy + HLS static file server |
| yt-dlp / go-ytdlp | 2026.02.21 / v1.3.1 | YouTube ingestion |
| FFmpeg | 7.x | HLS transcoding |

**Critical avoids:** Pages Router (deprecated), mongo-driver v1, Fiber framework, react-player, middleware.ts (use proxy.ts in Next.js 16).

### Expected Features

**Must have for launch (P1):**
- HLS video playback with adaptive bitrate (360p/480p/720p renditions)
- RTL Persian UI throughout — `dir="rtl"` on `<html>`, CSS logical properties everywhere
- Homepage with featured/trending rail and category sections
- Channel pages with episode lists; category and age-group browse pages
- Video player with speed control, autoplay-next, Persian subtitle (RTL VTT) support
- Basic search scoped to platform content
- Admin: channel, episode, category CRUD + YouTube URL ingestion with job status tracking
- Responsive design — mobile/tablet first, 60px+ touch targets for toddlers

**Add after validation (P2):**
- Optional user accounts (register/login) — unlocks subscribe, bookmark, continue-watching
- Admin: file upload ingestion, batch YouTube import, viewing stats

**Defer to v2+:**
- Smart TV / keyboard navigation, audio narration for pre-literate nav, PWA install, offline download

**Explicit anti-features (never build):** UGC, comments, recommendation algorithm, social sharing, mandatory accounts, email marketing, live streaming.

### Architecture Approach

Single Go project with two `cmd/` binaries sharing `internal/` packages. Site-api (`:8080`) serves the public site; admin-api (`:8081`) serves the admin panel and owns the transcoding worker pool. Both are internal to Docker's network — nginx is the only public ingress, handling TLS, routing, and HLS static file serving from a shared `hls-data` volume. Two independent Next.js apps (site on `:3000`, admin on `:3001`). One MongoDB database, five collections.

**Major components:**
1. `nginx` — single ingress, routes all traffic, serves HLS segments as static files
2. `cmd/site-api` + `cmd/admin-api` — Go binaries sharing `internal/` (models, repos, services, worker)
3. `internal/worker/` — goroutine pool: yt-dlp download → FFmpeg transcode → write to `/data/hls/`
4. `kidtube-site` (Next.js) — public browsing and playback, SSR via Server Components
5. `kidtube-admin` (Next.js) — content management dashboard
6. MongoDB — channels, episodes, categories, users, jobs collections

**Key patterns:** async 202-response job queue for ingestion (never block on FFmpeg), Server Components by default (only video player is Client Component), episodes in a separate collection (not embedded in channels), one MongoDB database shared by both APIs.

### Critical Pitfalls

1. **FFmpeg keyframe misalignment** — Use `-force_key_frames "expr:gte(t,n_forced*6)"` across ALL renditions in one command; never use `-g` (frame-count GOP). Missing master playlist is a related failure — always add `-master_pl_name master.m3u8`.

2. **MongoDB Go driver v2 silent behavior change** — `bson.M` decoding changed to `bson.D` by default. Decode into typed Go structs, never raw maps. Use `bson.ObjectID` not `primitive.ObjectID`. Define separate API response structs and convert via `.Hex()`.

3. **yt-dlp rate limiting / IP blocking** — YouTube 429s occur quickly with concurrent imports. Run downloads through a sequential job queue with `--sleep-interval 10 --max-sleep-interval 30`. Never run concurrent yt-dlp processes.

4. **Goroutine leaks in the transcoding pipeline** — Always use `exec.CommandContext(ctx, ...)` not `exec.Command`. Always `defer cancel()`. Clean up `/tmp` staging files and partial HLS output on failure.

5. **HLS.js SSR crash in Next.js** — Use `dynamic(() => import('./VideoPlayer'), { ssr: false })`. Initialize HLS.js inside `useEffect`, keep it in a `useRef`, never in render scope.

6. **RTL video player control mirroring** — Global `dir="rtl"` flips flex layout including the player. Wrap player controls in a hard `dir="ltr"` element. Test explicitly with RTL active.

7. **nginx CORS + MIME type misconfiguration for HLS** — Add `application/vnd.apple.mpegurl m3u8` and `video/mp2t ts` to the types block. Add `Access-Control-Allow-Origin *` and `Access-Control-Expose-Headers: Content-Length, Content-Range` on the `/hls/` location.

---

## Implications for Roadmap

### Phase 1: Foundation
**Rationale:** Nothing else can be built without this. Go project structure, MongoDB schema, and Docker Compose must exist before any feature work. RTL must be wired in from the first line of Next.js.
**Delivers:** Running skeleton — all services boot, connect, and return health checks. MongoDB collections and indexes created. Docker Compose with nginx routing. RTL + Vazirmatn font configured in site-app root layout.
**Addresses:** Go internal/ layout, mongo-driver v2 initialization with typed structs (avoids Pitfall 3), nginx CORS + MIME config (avoids Pitfall 7), Docker volume strategy.
**Avoids:** Do not proceed to any feature phase until `docker compose up` works end-to-end.

### Phase 2: Admin Content Pipeline
**Rationale:** Without content ingestion, there is no platform. Admin panel must exist before the public site — content must be seedable. This phase is the highest-risk technically.
**Delivers:** Admin-api CRUD for channels, episodes, categories. YouTube URL ingestion with async worker (202 response + job polling). FFmpeg multi-rendition HLS transcode. Job status visible in admin-app.
**Uses:** go-ytdlp v1.3.1, FFmpeg 7.x with `-force_key_frames` (avoids Pitfall 1), sequential job queue with sleep intervals (avoids Pitfall 4), goroutine pool with context cancellation (avoids Pitfall 9).
**Avoids:** Do not block admin-api HTTP handler on transcoding. Do not run concurrent yt-dlp downloads.

### Phase 3: Public Browsing and Playback
**Rationale:** The read path is the product. With seeded content from Phase 2, this phase delivers the core user experience.
**Delivers:** Homepage, channel pages, category/age-group browse, video player page with HLS playback + Persian subtitles + autoplay-next + speed control. Basic search. Responsive layout.
**Uses:** Video.js 8.23 with `dynamic(ssr: false)` (avoids Pitfall 5), `dir="ltr"` on player controls (avoids Pitfall 6), next/font for Vazirmatn (avoids FOUT), Server Components for all data fetching.
**Implements:** Full site-api REST endpoints. site-app App Router page structure.

### Phase 4: User Accounts and Personalization
**Rationale:** Accounts gate subscribe, bookmark, and continue-watching. Defer until core viewing loop is validated — these features are P2.
**Delivers:** User registration and login (JWT HttpOnly cookies), channel subscriptions, episode bookmarks, continue-watching progress tracking.
**Uses:** golang-jwt/jwt v5.3.0, users collection with embedded subscription/bookmark ID arrays (bounded, safe to embed per schema research).
**Avoids:** Do not make accounts mandatory. Anonymous viewing must always work.

### Phase 5: Polish and Operations
**Rationale:** Quality layer after all core features work.
**Delivers:** Admin file upload ingestion, batch YouTube import, viewing stats per episode, admin publish-date scheduling, nginx cache tuning (immutable .ts segments, no-cache .m3u8), performance audit.
**Implements:** Remaining P2 features. HLS cache-control split by file type (avoids Pitfall 13).

### Phase Ordering Rationale

- Foundation before features because schema changes ripple everywhere — the MongoDB schema must be right before code accumulates on top of it.
- Admin pipeline before public site because the public site needs real content to develop and test against.
- Accounts deferred because they gate nothing in the core viewing loop — the most important thing to validate is whether users watch content, not whether they log in.
- RTL is not a phase — it is a constraint baked into Phase 1 and cannot be retrofitted later.

### Research Flags

Phases needing deeper research or careful spec work before implementation:
- **Phase 2 (Video pipeline):** FFmpeg multi-rendition command is complex; use the exact skeleton from PITFALLS.md Pitfall 1 and validate output with `ffprobe` before proceeding. yt-dlp format selection needs testing against real URLs.
- **Phase 3 (Subtitles):** Persian VTT RTL cue styling (`direction:rtl`, `text-align:right`, bidi marks) needs hands-on testing — this is low-confidence territory with sparse tooling documentation.

Phases with standard patterns (skip additional research):
- **Phase 1 (Foundation):** Docker Compose + Go project structure + MongoDB connection are fully documented and low-variance.
- **Phase 4 (Auth):** JWT HttpOnly cookie auth in Gin is a well-established pattern; no novel decisions required.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official registries (pkg.go.dev, npm, GitHub releases) |
| Features | MEDIUM | Competitor analysis via WebSearch; no direct access to competitor admin panels; RTL specifics from multiple corroborating sources |
| Architecture | HIGH | Fixed stack reduces architecture variance; patterns verified against official Go, Next.js, and MongoDB docs |
| Pitfalls | HIGH | Most pitfalls sourced from official docs, issue trackers, and first-hand migration accounts |

**Overall confidence:** HIGH

### Gaps to Address

- **yt-dlp format strings for current YouTube:** YouTube changes its format availability; test the recommended format string (`bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]`) against real URLs before committing to the ingestion pipeline implementation.
- **Persian VTT rendering across browsers:** RTL subtitle cue styling behavior differs between browsers and Video.js versions. Needs manual testing during Phase 3.
- **Transcoding performance baseline:** The recommended FFmpeg command produces 4 renditions; actual transcode time on the target server hardware is unknown. Test early to size the worker pool correctly.
- **MongoDB text search with Persian (Farsi):** MongoDB's built-in `$text` index may not tokenize Persian correctly. May need a `simple` text index with explicit language hint or a fallback to regex search. Validate during Phase 3 search implementation.

---

## Sources

### Primary (HIGH confidence)
- Go Release History (go.dev) — Go 1.26 latest stable
- Gin releases (github.com/gin-gonic/gin) — v1.12.0, Go 1.24+ required
- mongo-driver v2 pkg.go.dev — v2.5.0, v2 migration guide
- Next.js 16 official blog + docs — App Router, Node 20.9+, proxy.ts
- MongoDB official embedding vs references docs
- MongoDB Go driver connection pool docs
- Next.js hydration error docs + dynamic import docs
- RTL guidelines for video controls — Firefox source engineering docs
- golang-jwt/jwt v5 pkg.go.dev
- go-ytdlp pkg.go.dev — v1.3.1
- Vazirmatn GitHub — official font repo
- yt-dlp GitHub issue #12589 — rate limiting confirmed
- JAMA algorithmic harm study (2024) — peer-reviewed basis for no-algorithm decision

### Secondary (MEDIUM confidence)
- Mux: FFmpeg HLS multi-quality transcode guide
- Mux: HLS best practices 2025
- shadcn/ui Tailwind v4 docs
- RTL UI design — UX Collective, POEditor
- Umputun blog: mongo-driver v2 migration first-hand account (Feb 2026)
- Streaming Learning Center: optimal HLS segment duration

### Tertiary (LOW confidence)
- Persian subtitle RTL rendering (forum source) — validate during Phase 3 implementation
- Go background job processing blog post — verify against official Go context docs

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
