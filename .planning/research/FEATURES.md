# Feature Research

**Domain:** Persian-language kids' educational video platform (VOD, curated content)
**Researched:** 2026-02-28
**Confidence:** MEDIUM — competitors analyzed via WebSearch and WebFetch; Persian/RTL specifics verified through multiple sources; no direct access to competitor admin panels

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Video playback with HLS adaptive streaming | Any video platform must play video smoothly | MEDIUM | HLS.js or Video.js with hls.js; adaptive bitrate for variable connections |
| Large thumbnail video grid / card browsing | YouTube-inspired layout is the mental model for all video platforms | LOW | Cards must be visually dominant; title text secondary |
| Channel pages with episode lists | YouTube Kids, Aparat Kids both organize by channel; users expect it | LOW | Channel art, description, episode list in order |
| Age-group filtering (toddler / kids / older) | Every competitor does this — YouTube Kids (preschool/younger/older), Sensical (2–4/5–7/8–10), Kidoodle | LOW | 3 tiers: 2–5, 6–10, optional 10+ |
| Category browsing (math, science, language, etc.) | Users expect to browse by subject, not just by channel | LOW | Predefined taxonomy; admin assigns categories to channels |
| Basic search (title / channel name) | Any content library needs search; even YouTube Kids offers it (with toggle) | MEDIUM | Search scoped to platform content only; no external links in results |
| Autoplay next episode | YouTube Kids and all streaming platforms autoplay by default | LOW | User can disable; platform default is ON for engagement |
| Playback speed control | Standard in all modern players; older kids especially use it | LOW | 0.75x, 1x, 1.25x, 1.5x |
| Persian subtitle support (SRT/VTT, RTL) | Target content is Persian-language; subtitles aid literacy development | MEDIUM | WebVTT with RTL text direction attribute; Persian text rendering requires explicit dir="rtl" in cue styling |
| Fully RTL UI layout | Platform is Persian-first; LTR layout is immediately jarring and unprofessional | HIGH | Next.js supports CSS logical properties; layout flip + mirroring rules needed throughout; video player controls are the one exception (do not mirror play/pause/seek icons) |
| Responsive design (mobile + tablet + desktop) | Most family viewing on tablets and phones; desktop is secondary | MEDIUM | Touch targets min 60x60px for toddlers; mobile-first breakpoints |
| Homepage with featured / trending content | Users need an editorial starting point; raw category grids feel empty | LOW | Featured carousel + trending rail is the standard pattern |
| Individual video/episode page | Clean player + metadata + related videos | LOW | Title, description, channel link, related episodes |
| No ads whatsoever | Core value prop of the platform; competitor differentiator vs YouTube | LOW | Architecture decision, not a feature to build |
| No external links in UI | Critical safety requirement; any external link is a safety failure | LOW | All hrefs must resolve to internal routes only |
| Admin: channel CRUD | Admin must create and manage channels | LOW | Name, description, thumbnail, category, age group assignment |
| Admin: episode CRUD with YouTube URL import | Core content ingestion path via yt-dlp | MEDIUM | Paste URL, trigger download + transcode pipeline, show status |
| Admin: file upload ingestion | Alternative content ingestion for non-YouTube sources | MEDIUM | Multipart upload to server, trigger FFmpeg transcode |
| Admin: HLS transcode status tracking | Admins need to see when videos are ready | LOW | Pending / processing / ready / failed states per episode |
| Admin: category and age-group management | Editorial taxonomy must be manageable | LOW | CRUD for categories and age groups referenced by channels |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Persian-first RTL experience | No major kids platform is built natively for Persian-speaking families; Aparat Kids exists but is general-purpose, not curated educational | HIGH | Not just translated — designed RTL from ground up; Vazirmatn or IRANSans font, proper kashida handling, Persian numeral option |
| Curated-only content (no algorithm) | Algorithm-driven platforms (YouTube, TikTok) push harmful content to kids; hand-curated library eliminates this risk entirely | LOW | No recommendation engine needed; editorial curation is the product |
| Pre-literate toddler-friendly navigation | Most platforms assume reading ability; icon-first + audio-cued navigation serves 2–5 age group | MEDIUM | Large colorful channel cards with audio label on hover/tap; minimal text dependency in browse UI |
| Channel subscription (optional accounts) | Persistent personalization without requiring accounts; lowers friction | LOW | Subscribe button saves to account; bookmarks work similarly |
| Bookmark / favorites | Lets parents curate a personal safe list; useful for parents who pre-select content | LOW | Requires user account; heart icon on cards |
| Continue watching | Resumable playback across sessions; expected by adults, delightful for kids | MEDIUM | Store progress per episode per user; requires account |
| Multiple video quality levels (HLS adaptive) | Accommodates variable Iranian internet connectivity; many families have slower connections | MEDIUM | FFmpeg produces 360p / 480p / 720p renditions; hls.js selects automatically |
| Admin: batch YouTube import | Content managers need to add many episodes quickly | MEDIUM | Accept comma-separated or newline-separated YouTube URLs; queue multiple jobs |
| Admin: content scheduling (publish date) | Allows advance content preparation; release on schedule | LOW | Published_at field; cron or query filter for published state |
| Admin: viewing stats per episode | Helps admin identify popular content and guide curation | MEDIUM | View counts, completion rates per episode; stored in MongoDB |
| Keyboard and remote-control navigation | Smart TV viewing is common in Iranian households | HIGH | Focus management, arrow-key navigation through grid; defer to v2 |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Explicitly decide not to build these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User-generated content / upload | "Let the community contribute" | Kids platforms require editorial control; UGC = unsafe content guarantee; content moderation is a full-time job | Admin-only content ingestion; curated library only |
| Comment sections | Social engagement, community building | Comments on children's platforms have been vectors for predators and inappropriate content; YouTube Kids has no comments | No comments anywhere; if feedback needed, contact form for parents only |
| Recommendation algorithm | "Show related content automatically" | Algorithms optimize for engagement, not safety; even YouTube's algorithm pushed harmful content to minors 700 times per 1,000 recommendations (JAMA study 2024) | Manual editorial curation; "more from this channel" and "same category" rails are safe alternatives |
| Social sharing / like buttons | Virality, engagement | Encourages external navigation, data collection concerns, not age-appropriate; kids clicking share opens unknown territory | View counts only (admin-visible); no public social actions |
| User accounts as required (mandatory registration) | "Know your users" | Mandatory accounts create friction; reduces viewership; COPPA compliance concern for under-13 | Anonymous viewing is the default; accounts are optional and only used for subscribe/bookmark |
| Email marketing / push notifications | Re-engagement | Children's privacy regulations (COPPA, GDPR-K) restrict collecting children's data; notifications are a dark pattern for this age group | No notifications in v1; if needed, parent-facing only |
| Live streaming | "Real-time educational sessions" | Significant infrastructure complexity; FFmpeg/nginx HLS stack is VOD-optimized; live adds latency buffering, chat moderation, encoder management | Curated VOD content only; pre-recorded is safer and more reliable |
| Payment / subscription tiers | Revenue model | All content must be free in v1; paywalls for kids educational content alienate users and reduce impact | Free access; no monetization layer in v1 |
| Autoplay from homepage on page load | "Immersive first impression" | Browsers block unmuted autoplay; muted autoplay is annoying UX; violates user intent | Play only when user taps/clicks a video; autoplay only for next episode within an active session |
| Complex parental controls dashboard | "Give parents full control" | Full parental control system (passcodes, per-child profiles, watch limits) is complex to build correctly; YouTube Kids took years to refine it | v1: content is curated and safe by design; optional accounts for subscribe/bookmark; no parental dashboard needed in v1 — the curation IS the control |
| Native mobile apps (iOS/Android) | "Better mobile experience" | Web-first with responsive design covers mobile sufficiently for v1; app development doubles maintenance burden | Progressive Web App (PWA) signal if demand is clear post-launch |
| Multi-language UI | "Reach wider audience" | Single Persian-language focus is the core differentiator; multiple languages dilute the identity and add localization complexity | Persian-only v1; English admin panel is acceptable |

---

## Feature Dependencies

```
[Video Playback]
    └──requires──> [HLS Transcoding Pipeline]
                       └──requires──> [Admin: Video Ingestion (YouTube URL or File Upload)]
                                          └──requires──> [Admin: Episode CRUD]
                                                             └──requires──> [Admin: Channel CRUD]
                                                                                └──requires──> [Admin: Category Management]

[Channel Subscription]
    └──requires──> [User Accounts (Optional)]

[Bookmark / Favorites]
    └──requires──> [User Accounts (Optional)]

[Continue Watching]
    └──requires──> [User Accounts (Optional)]
    └──requires──> [Video Playback]

[Persian Subtitle Rendering]
    └──requires──> [RTL-aware Video Player]
    └──requires──> [VTT file stored alongside HLS segments]

[Age-Group Browsing]
    └──requires──> [Admin: Age Group assignment on Channels]
    └──requires──> [Admin: Category Management]

[Search]
    └──requires──> [Content indexed in MongoDB with title/channel metadata]

[Homepage Featured/Trending]
    └──requires──> [Admin: ability to flag episodes/channels as featured]
    └──enhances──> [Category Browsing]

[Admin: Batch Import]
    └──enhances──> [Admin: YouTube URL Import]

[Admin: Viewing Stats]
    └──requires──> [Video Playback]
    └──requires──> [View count increment on play event]
```

### Dependency Notes

- **HLS Transcoding requires Channel+Episode CRUD first:** Content model must exist before ingestion pipeline is built. Admin panel foundations (channel, category, episode management) must be Phase 1.
- **User accounts are optional but gate multiple features:** Subscribe, bookmark, and continue-watching all require accounts. These features can be built in a later phase after core browsing and playback work.
- **RTL UI is a foundational decision:** Retrofitting RTL onto an LTR app is extremely painful. Must be established at project initialization via `dir="rtl"` on `<html>` and CSS logical properties (start/end vs left/right) from day one.
- **Featured/trending requires admin flagging:** No algorithm; editorial curation drives the homepage. Admin must be able to mark episodes or channels as featured.
- **Persian subtitles require both player and file support:** VTT files need RTL cue styling; the player must render them correctly. This is a player configuration concern, not just a file format concern.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Admin: Channel and episode management** — Without content, there is no platform; this is the absolute foundation
- [ ] **Admin: YouTube URL ingestion with yt-dlp + FFmpeg HLS transcode** — Core content pipeline; enables adding real content
- [ ] **Admin: Category and age-group assignment** — Taxonomy needed for browsing
- [ ] **Public: Homepage with featured/trending rail and category sections** — Entry point; sets the tone
- [ ] **Public: Category/age-group browse pages** — Primary discovery path for users who know what they want
- [ ] **Public: Channel pages with episode list** — Channel-level browsing
- [ ] **Public: Video player page with HLS playback, speed control, autoplay next** — Core user action
- [ ] **Public: Persian subtitle rendering (RTL VTT)** — Central to Persian-language value prop
- [ ] **Public: RTL UI throughout** — Non-negotiable for Persian audience; must be in v1
- [ ] **Public: Basic search (title/channel)** — Necessary for any content library
- [ ] **Responsive design (mobile + tablet)** — Most family viewing is not on desktop

### Add After Validation (v1.x)

Features to add once core viewing loop is working.

- [ ] **Optional user accounts (register/login)** — Unlocks subscribe, bookmark, continue-watching; add when retention data shows users want to return
- [ ] **Channel subscriptions and bookmarks** — Requires accounts; add alongside account system
- [ ] **Continue watching** — Requires accounts and progress tracking
- [ ] **Admin: file upload ingestion** — YouTube import covers most content; add file upload when content managers need it
- [ ] **Admin: batch YouTube import** — Quality-of-life for content managers; add when library growth demands it
- [ ] **Admin: viewing stats per episode** — Useful for editorial decisions; add when enough traffic to generate meaningful data

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Keyboard/remote navigation (Smart TV)** — High effort, validate demand first; significant UX work for TV layout
- [ ] **Offline download** — Adds storage complexity; validate if users need it (unlikely for curated educational platform)
- [ ] **Admin: content scheduling (publish date)** — Useful workflow feature; not needed until content team has advance queue
- [ ] **Audio narration for pre-literate navigation** — Enhances toddler UX; defer until core works well
- [ ] **PWA / app-like install** — Adds polish; not a launch requirement

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| HLS video playback | HIGH | MEDIUM | P1 |
| RTL UI throughout | HIGH | HIGH | P1 |
| Admin: channel + episode CRUD | HIGH | LOW | P1 |
| Admin: YouTube URL ingestion pipeline | HIGH | MEDIUM | P1 |
| Homepage featured/trending | HIGH | LOW | P1 |
| Category + age-group browse | HIGH | LOW | P1 |
| Persian subtitles (RTL VTT) | HIGH | MEDIUM | P1 |
| Responsive design | HIGH | MEDIUM | P1 |
| Search | MEDIUM | MEDIUM | P1 |
| Channel page with episodes | HIGH | LOW | P1 |
| Autoplay next episode | MEDIUM | LOW | P1 |
| Optional user accounts | MEDIUM | MEDIUM | P2 |
| Subscribe / bookmark | MEDIUM | LOW | P2 |
| Continue watching | MEDIUM | MEDIUM | P2 |
| Admin: file upload ingestion | MEDIUM | MEDIUM | P2 |
| Admin: batch YouTube import | MEDIUM | MEDIUM | P2 |
| Admin: viewing stats | MEDIUM | MEDIUM | P2 |
| Admin: publish date scheduling | LOW | LOW | P2 |
| Smart TV / keyboard navigation | MEDIUM | HIGH | P3 |
| Audio narration for pre-literate nav | MEDIUM | HIGH | P3 |
| PWA install | LOW | LOW | P3 |
| Offline download | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | YouTube Kids | Khan Academy Kids | Aparat Kids | Sensical | KidTube (Our Approach) |
|---------|--------------|-------------------|-------------|----------|------------------------|
| Age tiers | 3 tiers (preschool/younger/older) | Age-adaptive (2–8) | Present (unspecified) | 3 tiers (2–4/5–7/8–10) | 3 tiers (2–5/6–10/optional 11+) |
| Content source | Algorithm + UGC + curated | Fully curated educational | Curated Iranian content | Fully curated, expert-reviewed | Admin-curated only; YouTube as source |
| Parental controls | Comprehensive (passcode, timer, watch history, search toggle) | Minimal (no search, no algorithm) | Basic | Profile-based + time limits | None in v1 — curation is the control |
| Algorithm/recommendations | Yes (engagement-optimized) | No | Unknown | No (editorial curation) | No — deliberately excluded |
| Comments | No | No | Unknown | No | No |
| Search | Yes (parent-toggleable) | No | Yes | Limited by age profile | Yes (scoped to platform only) |
| RTL/Persian support | No native support | No | Yes (native Persian) | No | Yes — primary design axis |
| Ad-free | Requires YouTube Premium | Yes | No (has ads) | Ad-supported but family-safe | Yes — fully ad-free |
| User accounts required | Optional (Google account) | Optional | No | Optional | Optional |
| Subscribe/bookmark | Via Google account | No | No | No | Yes (with optional account) |
| HLS streaming | Yes (proprietary) | Not applicable (app) | Unknown | Unknown | Yes (self-hosted nginx) |
| Admin content management | N/A (YouTube CMS) | Internal | Internal | Internal | Custom admin panel |
| Persian subtitles | Crowdsourced, inconsistent | No | Unknown | No | Yes — first-class feature |

---

## Persian / RTL-Specific Feature Notes

These requirements exist because of the Persian-language focus and have no analog in English-language competitor research.

### RTL Layout Requirements (Confidence: HIGH — multiple official sources)

- Set `dir="rtl"` on the root `<html>` element; Next.js supports this globally
- Use CSS logical properties (`margin-inline-start`, `padding-inline-end`) throughout; avoid `left`/`right` directional properties
- Navigation bars flow right-to-left; back buttons point right (not left)
- Video player controls (play, pause, seek bar progress) are the **one exception** — do not mirror; seek bar should progress left-to-right even in RTL context (international standard; WebVTT and HLS do not change direction)
- Text alignment: right-aligned by default; numbers and timestamps remain LTR
- Icons: directional icons (arrows, chevrons) must be flipped; non-directional icons (play button, star, heart) must NOT be flipped

### Persian Typography Requirements (Confidence: MEDIUM)

- Use a Persian-optimized font: Vazirmatn (open source, recommended) or IRANSans
- Font size: 1–2px larger than equivalent Latin text for readability
- Do not apply letter-spacing to Persian text (Arabic-script fonts are cursive/connected)
- Persian numerals (۱۲۳) vs Eastern Arabic numerals vs Western Arabic numerals: pick one style and be consistent; Western Arabic (123) is acceptable and avoids encoding confusion

### Subtitle-Specific Requirements (Confidence: MEDIUM)

- Store subtitles as WebVTT (`.vtt`) files uploaded per episode
- VTT cues must include `direction:rtl` and `text-align:right` in the Cue Settings or via CSS `::cue`
- Mixed content (Persian text + English words or numbers) requires bidi handling; explicit RTL mark (`\u200F`) may be needed around mixed runs
- Upload path: admin uploads `.vtt` file alongside episode; stored adjacent to HLS segments on nginx

---

## Sources

- [YouTube Kids parental controls — Google Families Help](https://support.google.com/youtubekids/answer/6172308?hl=en) (MEDIUM confidence — official source)
- [YouTube Kids 2026 parent setup guide — ControlD](https://controld.com/blog/set-up-youtube-for-kids/) (MEDIUM confidence — third-party verified with Google official)
- [Sensical platform feature review — Amazon listing](https://www.amazon.com/SENSICAL-streaming-APPROPRIATE-EDUCATIONAL-CHARACTERS/dp/B0BK2ND3Y9) (MEDIUM confidence)
- [Sensical launch press release](https://www.sensical.tv/press/launch) (MEDIUM confidence — official source)
- [Must-have features for kids streaming apps — BetterMedia](https://bettermedia.tv/streaming-apps-for-kids-must-have-features/) (MEDIUM confidence)
- [Kids OTT streaming platform features — ToTheNew](https://www.tothenew.com/blog/kids-ott-how-streaming-platforms-help-parents-keep-viewing-safe/) (MEDIUM confidence)
- [Aparat Kids — Wikipedia](https://en.wikipedia.org/wiki/Aparat) (MEDIUM confidence)
- [Aparat Kids — CafeBazaar listing](https://cafebazaar.ir/app/com.aparat.kids?l=en) (LOW confidence — app store description only)
- [Algorithmic recommendation harm to children — JAMA Network Open](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2819134) (HIGH confidence — peer-reviewed)
- [RTL UI design for Arabic/Hebrew/Farsi — UX Collective](https://uxdesign.cc/designing-a-robust-right-to-left-ui-in-arabic-hebrew-and-farsi-d1e662a09cfa) (MEDIUM confidence)
- [RTL localization requirements — POEditor](https://poeditor.com/blog/rtl-localization/) (MEDIUM confidence)
- [UX for kids — Gen Alpha toddlers — BitsKingdom](https://bitskingdom.com/blog/ux-for-kids-gen-alpha-toddlers/) (MEDIUM confidence)
- [UI/UX design tips for children — AufaitUX](https://www.aufaitux.com/blog/ui-ux-designing-for-children/) (MEDIUM confidence)
- [Persian subtitle RTL rendering — TechGuy Forums](https://www.techguy.org/threads/how-to-view-subtitles-for-right-to-left-languages-persian-farsi.676247/) (LOW confidence — forum)
- [HLS best practices 2025 — Mux](https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025) (HIGH confidence — authoritative source)

---

*Feature research for: Persian kids' educational video platform (KidTube)*
*Researched: 2026-02-28*
