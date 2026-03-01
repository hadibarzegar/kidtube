# Roadmap: KidTube

## Overview

KidTube is built in five phases that follow a strict dependency chain: foundation first, then content ingestion, then the public viewing experience, then optional user accounts, and finally operational polish. Nothing is built on an unvalidated layer. RTL is a constraint baked into Phase 1 — it cannot be retrofitted.

## Milestone 1: v1 Launch

## Phases

- [x] **Phase 1: Foundation and Infrastructure** - Skeleton boots, all services connect, RTL and font configured (completed 2026-02-28)
- [x] **Phase 2: Admin Content Pipeline** - Admin can manage content and ingest YouTube videos into HLS (completed 2026-03-01)
- [ ] **Phase 3: Public Browsing and Playback** - Kids can browse channels and watch videos end-to-end
- [ ] **Phase 4: User Accounts and Personalization** - Optional accounts unlock subscriptions and bookmarks
- [ ] **Phase 5: Polish and Operations** - File upload ingestion, cache tuning, and operational hardening

## Phase Details

### Phase 1: Foundation and Infrastructure
**Goal**: All services start and connect, the Go project structure exists, MongoDB is initialized, nginx routes traffic and serves HLS, and RTL/Vazirmatn font is configured in the site app root layout.
**Depends on**: Nothing
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, RTL-01, RTL-02, RTL-04
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts all six services (mongo, site-api, admin-api, site-app, admin-app, nginx) with no errors and all pass health checks
  2. nginx reverse-proxies to site-api, admin-api, site-app, and admin-app, and the `/hls/` location serves static files with correct CORS headers and MIME types (application/vnd.apple.mpegurl for .m3u8, video/mp2t for .ts)
  3. MongoDB contains all five collections (channels, episodes, categories, users, jobs) with indexes applied on startup
  4. The Go project compiles two binaries (`cmd/site-api`, `cmd/admin-api`) sharing `internal/` packages; both health check endpoints respond 200
  5. The public site root layout has `dir="rtl"` and `lang="fa"` on `<html>`, Vazirmatn font loads via next/font with no layout shift, and all layout utilities use CSS logical properties
**Plans**: 4 plans

Plans:
- [x] 01-01: Docker Compose, nginx configuration, and volume strategy
- [x] 01-02: Go project structure, MongoDB schema, and shared internal packages
- [x] 01-03: Site-api and admin-api skeletons with health check endpoints
- [x] 01-04: Next.js site-app and admin-app scaffolding with RTL root layout and Vazirmatn font

### Phase 2: Admin Content Pipeline
**Goal**: Admin can create and manage channels, episodes, categories, and age groups through a dashboard UI, and can ingest video content via YouTube URL with async HLS transcoding — all visible via job status tracking.
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, VIDE-01, VIDE-02, VIDE-03, VIDE-04, VIDE-05, VIDE-06, ADMN-01, ADMN-02
**Success Criteria** (what must be TRUE):
  1. Admin can log in to the admin panel with credentials; all admin-api endpoints require a valid JWT token and return 401 without one
  2. Admin can create, edit, and delete channels (with category and age group assignment), episodes, categories, and age groups through the dashboard UI
  3. Admin can paste a YouTube URL and trigger ingestion; admin-api immediately returns 202 and the worker asynchronously downloads via yt-dlp (sequential queue, sleep intervals) then transcodes via FFmpeg to three HLS renditions (360p, 480p, 720p) with a master.m3u8
  4. Job status (pending / downloading / transcoding / ready / failed) is visible in the admin panel with live updates; failed jobs show error details and offer a retry action
  5. Completed HLS segments and playlists are written to the shared Docker volume and accessible via the nginx `/hls/` path
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Infrastructure fixes (Dockerfile, docker-compose), JWT auth, and admin user seeding
- [ ] 02-02-PLAN.md — All REST CRUD handlers (channels, episodes, categories, age groups, jobs, youtube-meta)
- [ ] 02-03-PLAN.md — Ingestion worker (yt-dlp sequential download + FFmpeg multi-rendition HLS transcode)
- [ ] 02-04-PLAN.md — Admin UI shell (sidebar, login, middleware) + categories and age groups pages
- [ ] 02-05-PLAN.md — Channels, episodes, and jobs UI pages with YouTube metadata auto-fetch and polling

### Phase 3: Public Browsing and Playback
**Goal**: Any visitor can browse the platform by category and age group, search for content, open a channel, and watch a video with full player controls — no account required.
**Depends on**: Phase 2
**Requirements**: BROW-01, BROW-02, BROW-03, BROW-04, BROW-05, BROW-06, BROW-07, PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07, RTL-03, RTL-05, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Homepage displays a featured/trending content rail and category sections with large thumbnail cards; pages are fully responsive with 60px+ touch targets on mobile
  2. User can browse channels grouped by category and filtered by age group (2-5, 6-10); channel page shows channel art, description, and episode list
  3. User can search for videos and channels by title and receive relevant results
  4. Video player loads HLS with adaptive bitrate switching, plays with large kid-friendly controls (no external links, no ads), offers 0.75x/1x/1.25x/1.5x speed control, and auto-plays the next episode when the current one ends
  5. Persian subtitles render correctly in RTL (WebVTT with direction:rtl); player controls are NOT mirrored by RTL layout (explicit dir="ltr" on controls wrapper)
  6. Navigation flows right-to-left with RTL-correct back button direction; all UI text is in Persian; content is viewable without any account
**Plans**: 4 plans

Plans:
- [ ] 03-01: Site-api REST endpoints (channels, episodes, categories, age groups, search)
- [ ] 03-02: Homepage, category browse, age-group browse, and channel pages (site-app, Server Components)
- [ ] 03-03: Video player (Video.js 8.23, HLS adaptive bitrate, dynamic import ssr:false, RTL-safe controls)
- [ ] 03-04: Persian subtitle support (RTL VTT cues), speed control, autoplay-next, and responsive polish

### Phase 4: User Accounts and Personalization
**Goal**: Users can optionally register and log in to subscribe to channels and bookmark episodes; all content remains viewable without an account.
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, ADMN-03
**Success Criteria** (what must be TRUE):
  1. User can register with email and password, log in and receive a JWT stored in an HttpOnly cookie, and stay logged in across browser refreshes
  2. All content (homepage, channels, episodes, video playback) remains fully accessible to visitors who are not logged in
  3. Logged-in user can subscribe to a channel and see their subscribed channels; can bookmark an episode and see their bookmarked episodes
  4. Admin can view the list of registered users in the admin dashboard
**Plans**: 3 plans

Plans:
- [ ] 04-01: User registration and login (site-api auth endpoints, JWT HttpOnly cookie, session persistence)
- [ ] 04-02: Channel subscriptions and episode bookmarks (site-api endpoints, site-app UI)
- [ ] 04-03: Admin user management view (admin-api endpoint, admin-app users table)

### Phase 5: Polish and Operations
**Goal**: The platform handles direct video file uploads, nginx cache is tuned for HLS performance, and the system is hardened for production operation.
**Depends on**: Phase 4
**Requirements**: VIDE-07
**Success Criteria** (what must be TRUE):
  1. Admin can upload a video file directly (as an alternative to YouTube URL) and it enters the same transcoding pipeline, producing HLS output in the shared volume
  2. nginx serves HLS segments (.ts) with immutable cache-control headers and .m3u8 playlists with no-cache headers, measurably improving repeat playback load times
  3. All six Docker services restart cleanly after a server reboot with no manual intervention required
**Plans**: 3 plans

Plans:
- [ ] 05-01: Direct file upload ingestion — admin-app UI, admin-api multipart endpoint, worker integration
- [ ] 05-02: nginx HLS cache tuning (immutable .ts, no-cache .m3u8) and MIME/CORS validation
- [ ] 05-03: Production hardening — restart policies, volume persistence verification, end-to-end smoke test

## Phase Dependencies

```
Phase 1 (Foundation)
    |
    v
Phase 2 (Admin Content Pipeline)
    |
    v
Phase 3 (Public Browsing and Playback)
    |
    v
Phase 4 (User Accounts and Personalization)
    |
    v
Phase 5 (Polish and Operations)
```

All phases are strictly sequential. No phase begins until the previous phase's success criteria are fully met.

## Coverage Validation

All 45 v1 requirements are mapped to exactly one phase.

| Requirement | Phase | Description |
|-------------|-------|-------------|
| INFRA-01 | Phase 1 | Docker Compose starts all services |
| INFRA-02 | Phase 1 | nginx reverse-proxy + HLS serving |
| INFRA-03 | Phase 1 | MongoDB collections and indexes |
| INFRA-04 | Phase 1 | Go project structure with shared internal/ |
| INFRA-05 | Phase 1 | Health check endpoints |
| RTL-01 | Phase 1 | dir="rtl" and lang="fa" on html root |
| RTL-02 | Phase 1 | CSS logical properties throughout |
| RTL-04 | Phase 1 | Vazirmatn font via next/font |
| CONT-01 | Phase 2 | Admin channel CRUD |
| CONT-02 | Phase 2 | Admin episode CRUD |
| CONT-03 | Phase 2 | Admin category CRUD |
| CONT-04 | Phase 2 | Admin age group CRUD |
| CONT-05 | Phase 2 | Category and age group assignment to channels |
| CONT-06 | Phase 2 | Admin dashboard UI with tables, search, filters |
| VIDE-01 | Phase 2 | YouTube URL paste and async ingestion trigger |
| VIDE-02 | Phase 2 | yt-dlp sequential download queue with rate limiting |
| VIDE-03 | Phase 2 | FFmpeg multi-rendition HLS transcode |
| VIDE-04 | Phase 2 | Job status visible in admin panel with live updates |
| VIDE-05 | Phase 2 | Failed job error details and retry |
| VIDE-06 | Phase 2 | HLS segments written to Docker volume served by nginx |
| ADMN-01 | Phase 2 | Admin login |
| ADMN-02 | Phase 2 | JWT-protected admin API endpoints |
| BROW-01 | Phase 3 | Homepage with featured/trending rail and category sections |
| BROW-02 | Phase 3 | Browse channels by category |
| BROW-03 | Phase 3 | Browse channels filtered by age group |
| BROW-04 | Phase 3 | Channel page with art, description, episode list |
| BROW-05 | Phase 3 | Search by title |
| BROW-06 | Phase 3 | Large thumbnail cards suitable for children |
| BROW-07 | Phase 3 | Responsive layout with 60px+ touch targets |
| PLAY-01 | Phase 3 | HLS playback with adaptive bitrate |
| PLAY-02 | Phase 3 | Playback speed control |
| PLAY-03 | Phase 3 | Auto-play next episode |
| PLAY-04 | Phase 3 | Persian subtitles with RTL VTT rendering |
| PLAY-05 | Phase 3 | Large kid-friendly player controls |
| PLAY-06 | Phase 3 | No external links or ads in player |
| PLAY-07 | Phase 3 | Player controls not mirrored in RTL layout |
| RTL-03 | Phase 3 | Navigation flows right-to-left |
| RTL-05 | Phase 3 | All UI text in Persian |
| AUTH-04 | Phase 3 | All content viewable without login |
| AUTH-01 | Phase 4 | User registration with email and password |
| AUTH-02 | Phase 4 | User login with JWT HttpOnly cookie |
| AUTH-03 | Phase 4 | Session persists across browser refresh |
| AUTH-05 | Phase 4 | Logged-in user can subscribe to channels |
| AUTH-06 | Phase 4 | Logged-in user can bookmark episodes |
| ADMN-03 | Phase 4 | Admin can view registered users |
| VIDE-07 | Phase 5 | Admin can upload video file directly |

**Coverage: 45/45 v1 requirements mapped. No orphans.**

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Infrastructure | 4/4 | Complete   | 2026-02-28 |
| 2. Admin Content Pipeline | 5/5 | Complete   | 2026-03-01 |
| 3. Public Browsing and Playback | 3/4 | In Progress|  |
| 4. User Accounts and Personalization | 0/3 | Not started | - |
| 5. Polish and Operations | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-01*
*Total phases: 5 | Total plans: 19 | v1 requirements: 45/45 covered*
