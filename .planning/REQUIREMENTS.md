# Requirements: KidTube

**Defined:** 2026-03-01
**Core Value:** Kids can safely watch curated Persian educational videos through an intuitive, age-appropriate interface — no ads, no external links, no distractions.

## v1 Requirements

### Infrastructure (INFRA)

- [x] **INFRA-01**: Docker Compose starts all services (mongo, site-api, admin-api, site-app, admin-app, nginx) with a single `docker compose up`
- [x] **INFRA-02**: nginx reverse-proxies to all services and serves HLS segments from a shared volume with correct CORS headers and MIME types
- [x] **INFRA-03**: MongoDB initializes with all required collections (channels, episodes, categories, users, jobs) and indexes
- [x] **INFRA-04**: Go backend project uses `cmd/site-api` and `cmd/admin-api` binaries sharing `internal/` packages
- [x] **INFRA-05**: Health check endpoints respond on both site-api and admin-api

### Content Management (CONT)

- [x] **CONT-01**: Admin can create, edit, and delete channels with name, description, thumbnail, category, and age group
- [x] **CONT-02**: Admin can create, edit, and delete episodes within a channel with title, description, order, and subtitle file
- [x] **CONT-03**: Admin can create, edit, and delete categories
- [x] **CONT-04**: Admin can create, edit, and delete age groups
- [x] **CONT-05**: Admin can assign categories and age groups to channels
- [x] **CONT-06**: Admin panel displays all content in a dashboard UI with tables, search, and filters

### Video Ingestion (VIDE)

- [ ] **VIDE-01**: Admin can paste a YouTube URL and trigger async download + HLS transcode
- [ ] **VIDE-02**: System downloads video via yt-dlp with rate-limiting protection (sequential queue, sleep intervals)
- [ ] **VIDE-03**: FFmpeg transcodes to multi-rendition HLS (360p, 480p, 720p) with keyframe-aligned segments and a master playlist
- [x] **VIDE-04**: Job status (pending/downloading/transcoding/ready/failed) is visible in admin panel with real-time updates
- [ ] **VIDE-05**: Failed jobs show error details and can be retried
- [ ] **VIDE-06**: HLS segments are written to a Docker volume served by nginx
- [ ] **VIDE-07**: Admin can upload a video file directly as an alternative to YouTube URL import

### Public Browsing (BROW)

- [x] **BROW-01**: Homepage displays featured/trending content rail and category sections
- [x] **BROW-02**: User can browse channels grouped by category
- [x] **BROW-03**: User can browse channels filtered by age group (2-5, 6-10)
- [x] **BROW-04**: User can view a channel page with channel art, description, and episode list
- [x] **BROW-05**: User can search for videos and channels by title
- [x] **BROW-06**: All browsing pages use large thumbnail cards suitable for children
- [x] **BROW-07**: All pages are fully responsive (mobile, tablet, desktop) with 60px+ touch targets

### Video Playback (PLAY)

- [ ] **PLAY-01**: Video player plays HLS streams with adaptive bitrate switching
- [x] **PLAY-02**: Player has playback speed control (0.75x, 1x, 1.25x, 1.5x)
- [x] **PLAY-03**: Player auto-plays next episode in channel when current episode ends
- [x] **PLAY-04**: Player displays Persian subtitles with correct RTL rendering (WebVTT with direction:rtl)
- [x] **PLAY-05**: Player uses large, kid-friendly controls (big play button, accessible seek bar)
- [x] **PLAY-06**: Player contains no external links or ads
- [x] **PLAY-07**: Player controls are NOT mirrored in RTL layout (explicit dir="ltr" on controls)

### Persian / RTL (RTL)

- [x] **RTL-01**: Document root has `dir="rtl"` and `lang="fa"` attributes
- [x] **RTL-02**: All layout uses CSS logical properties (margin-inline-start, padding-inline-end, etc.)
- [x] **RTL-03**: Navigation flows right-to-left; back buttons point right
- [x] **RTL-04**: Vazirmatn font loads via next/font with zero layout shift
- [x] **RTL-05**: All UI text is in Persian (admin panel may be English)

### User Accounts (AUTH)

- [x] **AUTH-01**: User can register with email and password
- [x] **AUTH-02**: User can log in and receive a JWT token (HttpOnly cookie)
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: All content is viewable without login — accounts are optional
- [ ] **AUTH-05**: Logged-in user can subscribe to channels
- [ ] **AUTH-06**: Logged-in user can bookmark episodes

### Admin Authentication (ADMN)

- [x] **ADMN-01**: Admin can log in with credentials
- [x] **ADMN-02**: Admin API endpoints are protected by JWT authentication
- [x] **ADMN-03**: Admin can view registered users

## v2 Requirements

### Enhanced User Features

- **USEF-01**: User can continue watching from where they left off (progress tracking)
- **USEF-02**: User can view their watch history

### Admin Enhancements

- **ADME-01**: Admin can batch-import multiple YouTube URLs at once
- **ADME-02**: Admin can view viewing stats per episode (view count, completion rate)
- **ADME-03**: Admin can schedule episode publish dates
- **ADME-04**: Admin can upload and manage subtitle files separately

### Platform Polish

- **PLSH-01**: nginx cache-control optimized (immutable .ts segments, no-cache .m3u8)
- **PLSH-02**: Performance audit and optimization pass
- **PLSH-03**: PWA manifest for app-like install on mobile

## Out of Scope

| Feature | Reason |
|---------|--------|
| User-generated content | Kids platforms require editorial control; UGC = unsafe content |
| Comments / social features | Predator vector on children's platforms; safety risk |
| Recommendation algorithm | Algorithms optimize for engagement, not safety; harmful to children |
| Social sharing / like buttons | Encourages external navigation; not age-appropriate |
| Mandatory accounts | Creates friction; reduces viewership |
| Email notifications | Children's privacy regulations; dark pattern for this age group |
| Live streaming | Significant infrastructure complexity; not needed for curated VOD |
| Payment / subscriptions | All content free in v1 |
| Native mobile apps | Web-first with responsive design covers mobile |
| Multi-language UI | Persian-only focus is the differentiator |
| Smart TV / keyboard navigation | High effort; validate demand first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| CONT-01 | Phase 2 | Complete |
| CONT-02 | Phase 2 | Complete |
| CONT-03 | Phase 2 | Complete |
| CONT-04 | Phase 2 | Complete |
| CONT-05 | Phase 2 | Complete |
| CONT-06 | Phase 2 | Complete |
| VIDE-01 | Phase 6 | Pending |
| VIDE-02 | Phase 6 | Pending |
| VIDE-03 | Phase 6 | Pending |
| VIDE-04 | Phase 2 | Complete |
| VIDE-05 | Phase 6 | Pending |
| VIDE-06 | Phase 6 | Pending |
| VIDE-07 | Phase 5 | Pending |
| BROW-01 | Phase 3 | Complete |
| BROW-02 | Phase 3 | Complete |
| BROW-03 | Phase 3 | Complete |
| BROW-04 | Phase 3 | Complete |
| BROW-05 | Phase 3 | Complete |
| BROW-06 | Phase 3 | Complete |
| BROW-07 | Phase 3 | Complete |
| PLAY-01 | Phase 6 | Pending |
| PLAY-02 | Phase 3 | Complete |
| PLAY-03 | Phase 3 | Complete |
| PLAY-04 | Phase 3 | Complete |
| PLAY-05 | Phase 3 | Complete |
| PLAY-06 | Phase 3 | Complete |
| PLAY-07 | Phase 3 | Complete |
| RTL-01 | Phase 1 | Complete |
| RTL-02 | Phase 1 | Complete |
| RTL-03 | Phase 3 | Complete |
| RTL-04 | Phase 1 | Complete |
| RTL-05 | Phase 3 | Complete |
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | Complete |
| AUTH-03 | Phase 4 | Complete |
| AUTH-04 | Phase 3 | Complete |
| AUTH-05 | Phase 4 | Pending |
| AUTH-06 | Phase 4 | Pending |
| ADMN-01 | Phase 2 | Complete |
| ADMN-02 | Phase 2 | Complete |
| ADMN-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓
- Complete: 32 | Pending: 13 (6 in Phase 4, 1 in Phase 5, 6 in Phase 6)

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after gap closure phase creation*
