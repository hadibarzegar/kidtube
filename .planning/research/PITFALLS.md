# Domain Pitfalls

**Domain:** Kids educational video platform (Go + MongoDB + Next.js + HLS)
**Researched:** 2026-03-01

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or total feature failure.

---

### Pitfall 1: HLS Segment Keyframe Misalignment

**What goes wrong:** FFmpeg can only begin a new segment at a keyframe boundary. If the source video has keyframes at irregular intervals (or none at the target time), segments will have inconsistent durations. Worse, in multi-bitrate (ABR) encoding, if different renditions (240p, 360p, 480p, 720p) don't share keyframe positions, the HLS player cannot switch quality levels mid-segment — it stutters, buffers, or plays the wrong rendition.

**Why it happens:** Using `-g` (GOP size in frames) to control keyframes is frame-rate dependent. A `-g 120` setting at 24fps gives 5-second GOPs, but at 30fps it gives 4-second GOPs. If the source video frame rate varies or differs from expected, keyframe positions diverge across renditions.

**Warning signs:**
- Segments vary wildly in duration (e.g., 3s, 9s, 5s instead of consistent 6s)
- ABR quality switching causes stutter or visual glitches
- ffprobe shows non-aligned keyframe timestamps across rendition files

**Prevention:**
- Always use `-force_key_frames "expr:gte(t,n_forced*6)"` (for 6-second segments) rather than `-g`
- Use identical `-force_key_frames` expressions across ALL renditions in a single FFmpeg command
- Set `hls_time` to match the forced keyframe interval
- For 4-second segments (better mobile): `-force_key_frames "expr:gte(t,n_forced*4)"`

**Recommended FFmpeg skeleton:**
```bash
ffmpeg -i input.mp4 \
  -force_key_frames "expr:gte(t,n_forced*6)" \
  -map 0:v -map 0:a -map 0:v -map 0:a \
  -c:v libx264 -c:a aac \
  -filter:v:0 scale=-2:240  -b:v:0 400k  -b:a:0 64k \
  -filter:v:1 scale=-2:360  -b:v:1 700k  -b:a:1 96k \
  -filter:v:2 scale=-2:480  -b:v:2 1200k -b:a:2 128k \
  -filter:v:3 scale=-2:720  -b:v:3 2500k -b:a:3 128k \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "stream_%v/seg_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" output_%v.m3u8
```

**Project phase:** Phase covering video ingestion and transcoding pipeline.

---

### Pitfall 2: Missing Master Playlist (Multivariant Playlist)

**What goes wrong:** Encoding multiple quality renditions but omitting the master playlist (`master.m3u8`) means the HLS player gets individual rendition playlists but has no way to discover other quality levels. ABR — the entire point of HLS — is silently disabled. The player picks one quality and stays there forever.

**Why it happens:** Simple FFmpeg HLS examples show a single `-f hls` output. Multi-rendition encoding is a separate, more complex command structure that beginners skip.

**Warning signs:**
- HLS.js logs show no `LEVEL_SWITCHING` events
- Quality selector in the player shows only one option
- No `master.m3u8` file in the output directory

**Prevention:**
- Always include `-master_pl_name master.m3u8` in the FFmpeg command
- Use `-var_stream_map` to declare rendition groups explicitly
- Point HLS.js at `master.m3u8`, never at an individual rendition playlist

**Project phase:** Phase covering video ingestion and transcoding pipeline.

---

### Pitfall 3: MongoDB Go Driver v2 BSON Decoding Behavior Change

**What goes wrong:** MongoDB Go Driver v2.0 (GA January 2025) silently changed the default BSON document decoding type. Previously, documents decoded into `bson.M` (maps, accessible by key string). In v2, they decode into `bson.D` (ordered slices of key-value pairs). Code compiles without errors but panics at runtime when accessing fields with map-style syntax like `doc["title"]`.

**Why it happens:** This is a silent runtime behavior change, not a compile-time error. The API surface looks the same; the bug only surfaces when running queries and accessing results.

**Warning signs:**
- Runtime panics with "interface conversion: interface {} is primitive.D, not primitive.M"
- Tests pass but production crashes on first real query with nested documents
- Code that worked with driver v1.x breaks without obvious compile errors

**Prevention:**
- Explicitly configure the decoder at connection setup: `clientOptions.SetBSONOptions(&options.BSONOptions{DefaultDocumentM: true})`
- Or, preferably, define Go structs for all documents and use typed decoding with `Decode()` — never rely on `bson.M` or `bson.D` directly in application code
- Add integration tests that actually decode query results end-to-end, not just check error returns

**Additional driver v2 migration gotchas:**
- `bson/primitive` package merged into `bson` — requires find-and-replace across entire codebase
- `Client.Connect()` method removed — call is now inside `mongo.Connect()`
- v2.0 had 20-25% slower BSON unmarshaling, fixed in v2.3 (August 2025) — pin to v2.3+
- `primitive` package removed: use `bson.ObjectID` not `primitive.ObjectID`

**Project phase:** Phase establishing the Go backend data layer.

---

### Pitfall 4: yt-dlp Rate Limiting and IP Blocking

**What goes wrong:** YouTube aggressively rate-limits automated download requests. After a small number of downloads in quick succession, the server IP receives HTTP 429 responses. Downloads silently fail, hang indefinitely, or produce partial/corrupt video files. If the admin panel allows multiple concurrent imports, the entire server IP can be blocked within minutes.

**Why it happens:** yt-dlp runs as a background process. Without explicit sleep intervals, retry logic, and queue-based rate limiting, the Go backend will fire requests as fast as operators submit YouTube URLs. YouTube's bot detection treats this as scraping.

**Warning signs:**
- yt-dlp exits with HTTP 429 or `Sign in to confirm you're not a bot` errors
- Downloads succeed in testing (low volume) but fail in real use (multiple imports)
- Partial `.mp4` files left on disk with no corresponding HLS output

**Prevention:**
- Run yt-dlp downloads through a **sequential job queue**, never concurrently
- Add `--sleep-interval 10 --max-sleep-interval 30` flags (10-30 second random delays)
- Use `--retries 5 --fragment-retries 5` with exponential backoff
- Always specify format explicitly: `-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]"` to avoid requesting unavailable formats
- Download to a staging directory, verify file integrity before triggering FFmpeg
- Design the admin panel to show queue status — operators must understand downloads are sequential and async

**yt-dlp format selection for this project:**
- Prefer: `-f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]"`
- FFmpeg is required for merging separate video/audio streams — it must be present in the same Docker container as yt-dlp

**Project phase:** Phase covering video ingestion pipeline and admin panel.

---

### Pitfall 5: HLS.js Hydration Mismatch in Next.js

**What goes wrong:** HLS.js requires browser APIs (`window`, `document`, `MediaSource`) that do not exist during server-side rendering. Importing or initializing HLS.js in a standard Next.js component causes either a build error, a runtime error during SSR, or a React hydration mismatch — where the server-rendered HTML differs from what the client renders after HLS.js initializes.

**Why it happens:** Next.js App Router defaults to server components. Even client components are pre-rendered on the server. Any code that touches browser-only APIs before the component mounts will fail.

**Warning signs:**
- `ReferenceError: window is not defined` during build or dev server startup
- React hydration error: "Hydration failed because the initial UI does not match what was rendered on the server"
- Video player appears briefly then disappears or shows wrong state
- `HLS.isSupported()` called during SSR returns undefined behavior

**Prevention:**
- Wrap the entire video player component in `dynamic(() => import('./VideoPlayer'), { ssr: false })`
- Inside the player component, initialize HLS.js inside a `useEffect` hook (not at module level, not in render)
- Check `HLS.isSupported()` before constructing an HLS instance — fall back to native HLS (Safari) otherwise
- Never pass HLS instance as a prop — keep it in a ref: `const hlsRef = useRef(null)`
- Mark the player file with `'use client'` directive at the top

**Correct initialization pattern:**
```typescript
'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (Hls.isSupported()) {
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(src);
      hlsRef.current.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      videoRef.current.src = src;
    }
    return () => hlsRef.current?.destroy();
  }, [src]);

  return <video ref={videoRef} controls />;
}
```

**Project phase:** Phase covering the public video player UI.

---

## Moderate Pitfalls

Mistakes that cause bugs, poor UX, or rework if caught late.

---

### Pitfall 6: RTL Mirroring of Video Player Controls

**What goes wrong:** Setting `dir="rtl"` on the document body (required for Persian) causes CSS Flexbox and Grid to flip direction automatically. This is correct for text, menus, and navigation. But a custom video player built with RTL-aware flex layout will mirror its controls: the play button moves to the right, the progress bar fills right-to-left, and volume controls flip. This is wrong — video controls are universal and should never be mirrored.

**Why it happens:** Developers apply RTL direction globally (correct) without creating RTL exceptions for media controls (required). CSS logical properties like `margin-inline-start` are RTL-aware, but a flex row in RTL context reverses child order.

**Warning signs:**
- Play button appears on the right side of the player bar
- Progress bar animates from right to left visually
- Fast-forward and rewind icons appear switched

**Prevention:**
- Wrap the video player controls in an element with explicit `dir="ltr"` to override the document direction
- Use `direction: ltr` in the player's CSS scope
- Never rely on global RTL cascade for player controls
- Test specifically with RTL document direction active

**What should be RTL:** Page layout, navigation, sidebars, text, timestamps in Persian, episode titles, channel names.

**What should NOT be RTL:** Video player controls, progress bar, volume slider, playback speed UI, any element using directional icons (play, pause, skip, rewind).

**Project phase:** Phase covering the video player and public site layout.

---

### Pitfall 7: nginx CORS and MIME Type Misconfiguration for HLS

**What goes wrong:** When the Next.js frontend (served from one origin or port) requests HLS segments from nginx (served from a different port or subdomain), browsers block the requests due to CORS policy. Additionally, if nginx does not declare the correct MIME types for `.m3u8` and `.ts` files, browsers refuse to process them. Both failures are silent from the application layer — the video player simply fails to load with a cryptic network error.

**Why it happens:** Default nginx configurations do not include HLS MIME types. Docker Compose setups often expose nginx on a different port than the Next.js dev server, creating cross-origin issues in development that don't exist in production (or vice versa).

**Warning signs:**
- Browser console shows `CORS error` or `No 'Access-Control-Allow-Origin' header`
- Browser console shows `Failed to load resource` for `.m3u8` or `.ts` files
- nginx returns `application/octet-stream` for `.m3u8` files
- HLS.js error: `manifestLoadError` or `fragLoadError`

**Prevention:**
Required nginx configuration additions:

```nginx
# In http block or server block
types {
    application/vnd.apple.mpegurl m3u8;
    video/mp2t                    ts;
}

# In location block for HLS files
location /hls/ {
    add_header 'Access-Control-Allow-Origin'  '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Range' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }

    root /var/hls;
    add_header Cache-Control "public, max-age=3600";
}
```

**Project phase:** Phase covering infrastructure and Docker Compose setup.

---

### Pitfall 8: MongoDB Schema — Unbounded Array Growth in Video Documents

**What goes wrong:** Embedding video analytics, view counts, or comment-like data directly in the episode document causes the document to grow unbounded. MongoDB has a 16MB document size limit. More practically, any field that can grow (e.g., `viewedBy: [userId, ...]`, `comments: [...]`) will make the episode document slow to read and write as it grows — and eventually hit the hard limit.

**Why it happens:** The simplicity of MongoDB embedding tempts developers to put related data inside the parent document. This works well for small, stable sub-documents (e.g., embedding subtitle track metadata) but fails for data that grows with usage.

**Warning signs:**
- Episode documents taking more than a few KB
- Slow reads on episode fetch as catalog grows
- `MongoError: document too large` on write

**Prevention:**
- Embed only: subtitle tracks (small, fixed-size, always accessed with video), thumbnail URLs (strings), age group tags, category references
- Reference (separate collection) for: view counts (update-heavy), user bookmarks, watch history, subtitle file content
- Use the **Bucket Pattern** for analytics: aggregate views into time-bucketed documents rather than per-user arrays
- Index `episodeId` on all reference collections to keep lookups fast

**Project phase:** Phase establishing MongoDB schema and data layer.

---

### Pitfall 9: Go Goroutine Leaks in the Video Processing Pipeline

**What goes wrong:** Each video import (yt-dlp download + FFmpeg transcode) runs as a background goroutine. If the goroutine is not tied to a context with cancellation, it runs indefinitely even if the admin cancels the job, the server restarts, or the process crashes mid-way. Over time, leaked goroutines accumulate: each holds file handles, subprocess references, and 2KB+ of stack. A production server processing dozens of imports can exhaust memory.

**Why it happens:** Spawning `go func()` without a cancellation context is the default pattern for beginners. FFmpeg and yt-dlp run as `exec.Command` subprocesses — if the goroutine managing them is leaked, the subprocess may also remain alive consuming CPU.

**Warning signs:**
- Goroutine count grows monotonically in metrics/pprof
- `ffmpeg` or `yt-dlp` processes visible in `ps aux` after job completion
- Server memory increases over time without corresponding load increase
- Partial HLS output directories accumulate on disk

**Prevention:**
- Always create jobs with a `context.Context` and always `defer cancel()`
- Pass the context to `exec.CommandContext(ctx, "ffmpeg", ...)` — Go will kill the subprocess when context is cancelled
- Maintain a job registry (in-memory map with mutex) so admin API can cancel specific jobs
- On server shutdown, cancel the root context and wait for all jobs to exit with a timeout
- Clean up partial output directories when a job fails or is cancelled

**Project phase:** Phase covering video ingestion job system.

---

### Pitfall 10: Docker Volume I/O Bottleneck for Concurrent Transcoding

**What goes wrong:** Docker named volumes on macOS use osxfs or VirtioFS, which have significantly lower I/O throughput than native Linux filesystem access. When FFmpeg writes HLS segments to a Docker volume on macOS during development, transcoding can be 3-10x slower than expected. On Linux production servers this is not an issue, but it causes misleading benchmarks during local development.

**Why it happens:** Docker Desktop on macOS adds a virtualization layer for filesystem mounts. This is invisible to the application but measurable under load.

**Warning signs:**
- FFmpeg transcoding taking much longer on Mac than expected
- High disk wait times during Docker-based transcoding
- Transcoding speed increases dramatically when volumes are moved to Docker's internal filesystem

**Prevention:**
- Accept the macOS dev performance difference — do not optimize for it
- Benchmark transcoding times only on Linux (production-equivalent environment)
- Use Docker bind mounts (not named volumes) sparingly during development; prefer volume mounts in production for portability
- Consider running the transcoding worker natively (outside Docker) during local development for faster iteration

**Project phase:** Infrastructure and Docker Compose setup. Operational awareness, not a code fix.

---

### Pitfall 11: Go Driver ObjectID JSON Serialization

**What goes wrong:** MongoDB ObjectIDs (`bson.ObjectID` in driver v2, `primitive.ObjectID` in v1) serialize to hex strings in JSON. However, the zero-value of `ObjectID{}` serializes to `"000000000000000000000000"` — not `null` and not omitted. This causes API responses to include placeholder IDs on documents that haven't been inserted yet, and can cause client-side bugs where code treats a zero ObjectID as a valid reference.

**Why it happens:** Go's `omitempty` tag with `bson:"_id,omitempty"` works for BSON marshaling but has historically been unreliable for JSON marshaling of `ObjectID` types (since `ObjectID{}` is not the zero value for its underlying type in all Go versions).

**Warning signs:**
- API responses contain `"id": "000000000000000000000000"` for uninitialized documents
- Client treats phantom IDs as valid, making requests that return 404
- Bookmark or subscription data referencing zero ObjectIDs in the database

**Prevention:**
- Always generate ObjectIDs server-side before inserting: `id := bson.NewObjectID()`
- Define separate API response structs with `ID string json:"id"` (plain string) rather than embedding `ObjectID` directly in JSON responses
- Convert: `resp.ID = doc.ID.Hex()` when building API responses
- Validate ObjectID format in all handler inputs: `bson.ObjectIDFromHex(idStr)` returns an error for invalid strings

**Project phase:** Phase establishing Go API handlers and response models.

---

## Minor Pitfalls

Issues that are annoying but recoverable without major rework.

---

### Pitfall 12: Vazirmatn Font Loading Flash (FOUT)

**What goes wrong:** Loading Vazirmatn via an external CDN or as a runtime import causes a Flash of Unstyled Text (FOUT) — Latin or system fallback font renders briefly before Vazirmatn loads. For a Persian kids' platform this is visually jarring, especially at first load on slow connections.

**Warning signs:**
- Text re-renders with different font 200-500ms after page load
- Lighthouse reports CLS (Cumulative Layout Shift) score degraded by font swap
- Different rendering in development (fast) vs. production (CDN latency)

**Prevention:**
- Use `next/font` with the `@fontsource/vazirmatn` package or the `next-persian-fonts` package — Next.js will inline the font declaration and preload critical weights
- Load only required weights (400, 700) — Vazirmatn has multiple weights; loading all of them adds unnecessary bytes
- Set `font-display: swap` as fallback if using self-hosted, but prefer `next/font` which handles this automatically
- Define a system font fallback stack with similar x-height to minimize layout shift: `font-family: 'Vazirmatn', 'Tahoma', 'Arial', sans-serif`

**Project phase:** Phase covering public site UI foundation.

---

### Pitfall 13: HLS Segment Cache-Control on nginx

**What goes wrong:** Without explicit Cache-Control headers, nginx serves HLS segments with browser defaults (often no-cache or very short TTL). For a VOD platform this wastes server bandwidth — every segment re-request hits nginx instead of browser cache. Conversely, m3u8 playlist files must NOT be cached (they point to specific segments).

**Prevention:**
- Serve `.ts` segments with `Cache-Control: public, max-age=86400` (24 hours — segments are immutable once written)
- Serve `.m3u8` playlists with `Cache-Control: no-cache` for live, or `Cache-Control: public, max-age=3600` for VOD
- Use different nginx `location` blocks for `~\.ts$` vs `~\.m3u8$`

**Project phase:** Infrastructure and nginx configuration.

---

### Pitfall 14: Go Middleware Execution Order

**What goes wrong:** Go HTTP middleware chains execute in registration order. A common mistake is registering authentication middleware before the CORS middleware, causing preflight OPTIONS requests (which don't carry auth headers) to fail with 401 before CORS headers are added. This makes the entire API inaccessible from browsers despite auth being properly configured.

**Warning signs:**
- Browser shows CORS errors on authenticated endpoints
- OPTIONS requests return 401
- API works with curl but not from browser

**Prevention:**
- Register middleware in this order: CORS → Logger → Auth → Route handlers
- Always handle OPTIONS requests in the CORS middleware before any auth check
- Write a middleware integration test that sends an OPTIONS preflight and asserts 200/204 with correct CORS headers

**Project phase:** Phase establishing the Go API layer.

---

### Pitfall 15: yt-dlp Metadata Extraction for Non-Standard YouTube URLs

**What goes wrong:** yt-dlp extracts video title, description, thumbnail, and duration during download. However, some YouTube URLs (shorts, age-restricted videos, geo-blocked content, private videos) either fail extraction entirely or return incomplete metadata. Thumbnails for some videos are `.webp` format, not `.jpg`, which some image rendering paths do not handle.

**Warning signs:**
- Video imported with empty title or description
- Thumbnail URL returns 404 after download
- yt-dlp exits with error code 1 but no clear error message in logs

**Prevention:**
- Always run `yt-dlp --dump-json URL` first (metadata-only, no download) to validate accessibility before queuing the download
- Treat all yt-dlp metadata fields as optional — never assume title, description, or thumbnail will be present
- Download thumbnails locally (do not hotlink YouTube's thumbnail CDN) — convert `.webp` to `.jpg` via FFmpeg during ingestion
- Log yt-dlp stderr output to a persistent job log visible in the admin panel

**Project phase:** Phase covering video ingestion admin panel.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| FFmpeg transcoding setup | Keyframe misalignment across renditions | Use `-force_key_frames` with time expression, identical across all renditions |
| FFmpeg transcoding setup | Missing master playlist | Always use `-master_pl_name` + `-var_stream_map` |
| MongoDB data layer | Driver v2 BSON decoding behavior | Decode into typed structs; set `DefaultDocumentM` if using raw maps |
| MongoDB data layer | ObjectID JSON serialization | Define separate API response structs; convert via `.Hex()` |
| MongoDB data layer | Unbounded array growth | Separate collections for view counts, bookmarks, watch history |
| Go API handlers | Middleware order | CORS before auth always; test OPTIONS preflight |
| Go API handlers | Error handling across goroutines | Centralized error handler; never ignore goroutine errors |
| Video ingestion pipeline | yt-dlp rate limiting | Sequential job queue; sleep intervals; exponential backoff |
| Video ingestion pipeline | Goroutine leaks | Always use `exec.CommandContext`; defer cancel; cleanup on failure |
| Video ingestion pipeline | Partial output on failure | Atomic output: write to temp dir, move to final on success only |
| Next.js video player | HLS.js SSR crash | `dynamic(import, { ssr: false })`; init inside `useEffect` |
| Next.js video player | RTL controls mirroring | `dir="ltr"` wrapper on player controls |
| nginx/Docker setup | CORS errors for HLS segments | Explicit CORS headers and MIME types in nginx config |
| nginx/Docker setup | Docker macOS I/O | Benchmark on Linux only; accept macOS slowness as dev artifact |
| Persian/RTL UI | Vazirmatn FOUT | Use `next/font` with `@fontsource/vazirmatn`; preload critical weights |
| Persian/RTL UI | Video controls mirrored | Hard `dir="ltr"` on player container |

---

## Sources

- [MongoDB Go Driver v2 Migration — Umputun (February 2026)](https://p.umputun.com/en/2026/02/21/mongodb-go-driver-v2/) — HIGH confidence: first-hand migration account, recent
- [MongoDB Go Driver v2 Official Docs — Upgrade Guide](https://www.mongodb.com/docs/drivers/go/v2.0/reference/upgrade/) — HIGH confidence: official
- [MongoDB Embedded vs Referenced Data — Official Docs](https://www.mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references/) — HIGH confidence: official
- [Choosing Optimal HLS Segment Duration — Streaming Learning Center](https://streaminglearningcenter.com/learning/choosing-the-optimal-segment-duration.html) — MEDIUM confidence: domain expert, not official spec
- [Multi-Bitrate HLS with FFmpeg — Mux](https://www.mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg-a-step-by-step-guide) — MEDIUM confidence: authoritative streaming vendor
- [FFmpeg HLS Segmenter Best Practices 2026 — CopyProgramming](https://copyprogramming.com/howto/hls-implementation-with-ffmpeg) — MEDIUM confidence: aggregated from multiple sources
- [RTL Guidelines for Video Controls — Firefox Source Docs](https://firefox-source-docs.mozilla.org/code-quality/coding-style/rtl_guidelines.html) — HIGH confidence: official browser engineering docs
- [RTL Design UX Guide — Number Analytics](https://www.numberanalytics.com/blog/designing-for-rtl-ux-guide) — MEDIUM confidence
- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error) — HIGH confidence: official
- [Next.js Dynamic Imports — Official Docs](https://nextjs.org/docs/pages/guides/lazy-loading) — HIGH confidence: official
- [yt-dlp GitHub — Rate Limiting Issue #12589](https://github.com/yt-dlp/yt-dlp/issues/12589) — HIGH confidence: official issue tracker
- [Goroutine Leak in Production — Skoredin (2025)](https://skoredin.pro/blog/golang/goroutine-leak-debugging) — MEDIUM confidence: real-world case study
- [Vazirmatn Font — GitHub](https://github.com/rastikerdar/vazirmatn) — HIGH confidence: official font repository
- [Scaling yt-dlp for AI Scraping — Medium](https://medium.com/@datajournal/how-to-use-yt-dlp-to-scrape-youtube-videos-with-proxies-38255a65c20d) — LOW confidence: single source, unverified claims
- [nginx CORS Setup for HLS — Foliovision](https://foliovision.com/support/fv-wordpress-flowplayer/how-to/setting-up-cors-headers-for-nginx-stream-server) — MEDIUM confidence
