# KidTube

## What This Is

A Persian-language kids' educational and language learning video platform. Parents and children browse channels of curated educational content sourced from YouTube, transcoded to HLS, and served through a kid-friendly interface inspired by YouTube but designed for children aged 2–10+. All content is freely accessible; optional accounts let users subscribe to channels and bookmark favorites.

## Core Value

Kids can safely watch curated Persian educational videos through an intuitive, age-appropriate interface — no ads, no external links, no distractions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Public video platform with YouTube-like browsing (channels, categories, age groups)
- [ ] Custom video player with Persian subtitle support, speed control, auto-play, and safe-mode UI
- [ ] Admin panel for managing channels, episodes, categories, age groups, and users
- [ ] Video ingestion via YouTube URL import and manual file upload with HLS transcoding
- [ ] Optional user accounts with channel subscription and bookmarking
- [ ] Content discovery via category browsing, search, featured/trending, and age filtering
- [ ] Responsive, kid-friendly UI design suitable for ages 2–10+
- [ ] Docker Compose deployment with all services containerized

### Out of Scope

- Live streaming — adds significant infrastructure complexity, not needed for curated content
- Payment/subscription — all content is free in v1
- Mobile native apps — web-first, responsive design covers mobile
- Comments/social features — kids' safety concern, keep it simple
- Multi-language support beyond Persian — single-language focus for v1
- Real-time notifications — not needed for a VOD platform in v1

## Context

**Content model:** Channels contain episodes. Channels are grouped by categories (math, science, language, etc.) and tagged with age groups (toddler 2–5, kids 6–10). Episodes are individual videos with metadata, thumbnails, and optional Persian subtitles.

**Video pipeline:** Admin either pastes a YouTube URL (system downloads via yt-dlp and transcodes) or uploads a video file directly. FFmpeg transcodes to HLS (multiple quality levels). HLS segments stored locally on the server, served via nginx.

**Architecture:** Single Go project with separate cmd entrypoints and route groups for site API and admin API. Next.js powers two separate frontend apps: the public site and the admin panel. MongoDB for all data storage.

**Target audience:** Persian-speaking families. Kids aged 2–10+ are the viewers; parents may browse and set up accounts. The UI must work for pre-literate toddlers (big visual cards, auto-play) and reading-age kids (search, categories).

**Design direction:** YouTube-inspired layout but colorful, rounded, and kid-safe. Large thumbnails, playful typography, no external links or ads. The player should be prominent with large, accessible controls.

## Constraints

- **Tech stack**: Go + MongoDB + Next.js — chosen by project owner, non-negotiable
- **Video source**: YouTube content downloaded and transcoded — not streamed from YouTube
- **Storage**: Local/self-hosted HLS segments served via nginx — no cloud object storage
- **Deployment**: Docker Compose on a single server
- **Language**: Persian (Farsi) — RTL layout, Persian typography throughout
- **Architecture**: Single Go backend project with separate cmds for site-api and admin-api; two separate Next.js apps for site and admin panel

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Go + MongoDB + Next.js stack | Owner's preference and expertise | — Pending |
| Single Go project, split cmds/routes | Code reuse between APIs while keeping concerns separate | — Pending |
| Local HLS storage via nginx | Simplicity, no cloud dependency, single-server deployment | — Pending |
| YouTube-like but kid-friendly design | Familiar UX paradigm adapted for child safety and engagement | — Pending |
| Optional accounts (not required) | Lower barrier — anyone can watch, accounts add subscribe/bookmark | — Pending |
| yt-dlp + FFmpeg pipeline | Standard tools for YouTube download and HLS transcoding | — Pending |

---
*Last updated: 2026-02-28 after initialization*
