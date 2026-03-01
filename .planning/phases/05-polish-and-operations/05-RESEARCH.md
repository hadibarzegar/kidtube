# Phase 5: Polish and Operations — Research

**Researched:** 2026-03-01
**Domain:** Multipart file upload (Go), nginx cache tuning, Docker Compose production hardening
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Upload Experience**
- Drag-and-drop zone with click-to-browse fallback for file selection
- File size limit of 2GB maximum
- Accept common video formats: MP4, MKV, MOV, AVI, WebM
- Progress bar with percentage, file size, and estimated time remaining during upload

**Admin UI Integration**
- Tabbed interface on the episode form: "YouTube URL" tab and "Upload File" tab — clean separation with both visible as options
- Details-first flow: admin fills in episode metadata (title, description, order), then selects/drops the file — upload starts on form submit
- Uploaded videos appear in the same jobs list as YouTube downloads, with a "source" column distinguishing "YouTube" vs "Upload"
- Single file upload per episode (no batch upload)

**Cache & Production Hardening**
- Immutable cache-control for .ts segments, no-cache for .m3u8 playlists
- `restart: unless-stopped` for all Docker services
- Volume persistence verification as part of restart testing

### Claude's Discretion
- Exact drag-and-drop component styling (match existing admin panel aesthetic)
- Upload chunking strategy for large files
- Cache header exact values and CORS tuning
- Docker healthcheck configuration
- Error states and retry behavior for failed uploads
- Temporary file cleanup after successful transcoding

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIDE-07 | Admin can upload a video file directly as an alternative to YouTube URL import | Multipart endpoint in admin-api, file saved to HLS volume as source.mp4, worker.Enqueue() used to feed same pipeline as YouTube path; tabbed UI on episode form |
</phase_requirements>

---

## Summary

Phase 5 has three independent but coordinated concerns: (1) a direct video file upload path that feeds the existing worker pipeline, (2) nginx cache tuning for HLS performance, and (3) confirming the Docker Compose deployment is production-hardened.

For the upload feature (Plan 05-01), the approach is clear and well-precedented. The Go admin-api needs a new `POST /episodes/upload` multipart endpoint that uses `http.MaxBytesReader` (capped at 2GB), streams the body via `r.MultipartReader()`, and `io.Copy`s the file directly to `{hlsRoot}/{episodeID}/source.mp4` — the same path the worker already expects for source files downloaded by yt-dlp. The episode document and Job document are created the same way as the YouTube path, and `worker.Enqueue()` is called identically. The Job model needs a `source` field (`"youtube"` | `"upload"`) for the jobs list "source" column. The admin-app episode form refactors its YouTube URL section into a two-tab layout (`'use client'` component). Progress requires `XMLHttpRequest` rather than `fetch` because the Fetch API has no upload progress event; XHR's `xhr.upload.onprogress` fires with `loaded` and `total` bytes.

For nginx cache tuning (Plan 05-02), the critical pitfall is `add_header` inheritance: any `add_header` in a child location block silently drops all `add_header` directives from the parent. The current `/hls/` block sets four CORS headers; splitting into nested `.ts` and `.m3u8` locations requires repeating those four CORS headers in each child block. The simpler and correct approach is to use two sibling top-level regex locations (`~ \.ts$`, `~ \.m3u8$`) inside the `/hls/` scope — or, more robustly, use a `map` directive plus a single location. The correct cache values are: `.ts` → `Cache-Control: public, max-age=31536000, immutable` (segments are content-addressed and never change); `.m3u8` → `Cache-Control: no-cache` (playlists must revalidate).

For production hardening (Plan 05-03), all six services already have `restart: unless-stopped` and `healthcheck` blocks in `docker-compose.yml`. The plan is primarily verification: reboot the host, confirm all services come back clean, confirm the `./data/hls` bind mount survives reboot, and run an end-to-end smoke test. No new Docker configuration is required — the foundation is already correct.

**Primary recommendation:** Keep the upload path a thin wrapper around the existing worker pipeline — save to `source.mp4`, create Job with `source: "upload"`, call `Enqueue()`. Do not add a separate pipeline. The complexity budget is in the frontend progress UI.

---

## Standard Stack

### Core (all existing — no new dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go `net/http` | stdlib | Multipart endpoint, `http.MaxBytesReader`, `r.MultipartReader()` | Already used; no new dependency |
| `io.Copy` | stdlib | Stream uploaded file to disk without buffering in RAM | Standard Go streaming pattern |
| `os.MkdirAll` + `os.Create` | stdlib | Write source.mp4 to HLS volume directory | Already used in worker |
| `XMLHttpRequest` | browser API | Upload progress events (`xhr.upload.onprogress`) | Only browser API with upload progress; Fetch has no equivalent |
| nginx `add_header` | nginx 1.25 | Set Cache-Control per file type via location blocks | Already in use; no new module needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `mime/multipart` | stdlib | `multipart.Part` iteration in streaming upload | Used indirectly via `r.MultipartReader()` |
| nginx `map` directive | nginx 1.25 | Alternative approach for per-extension cache headers | Use if the nested-block approach becomes unwieldy |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `XMLHttpRequest` | `fetch` | Fetch has no upload progress event; XHR is the right tool here |
| Repeat CORS headers in each location | `ngx_headers_more` module | headers-more solves inheritance elegantly but requires rebuilding nginx Docker image — not worth it for 2 locations |
| Streaming upload to temp then move | Direct write to final path | Direct write is fine because the path is known upfront from episode ID |

**Installation:** No new packages. No `npm install`, no `go get`. All required capabilities are in the existing stack.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. All changes fit into existing structure:

```
backend/internal/handler/
├── episode.go          # Add UploadEpisode handler
backend/internal/worker/
├── processor.go        # Add processUpload() — saves file, calls transcodeHLS()
admin-app/src/app/episodes/[id]/
├── page.tsx            # Refactor to tabbed UI (YouTube tab + Upload tab)
nginx/
├── nginx.conf          # Add nested .ts/.m3u8 locations under /hls/
```

### Pattern 1: Streaming Multipart Upload in Go

**What:** Read uploaded file in streaming chunks directly to disk — no full-file memory buffer.

**When to use:** Any file > a few MB. For 2GB files, this is non-negotiable.

```go
// In handler: cap request size, then stream to disk
func UploadEpisode(database *mongo.Database, hlsRoot string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        const maxBytes = 2 * 1024 * 1024 * 1024 // 2GB
        r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

        mr, err := r.MultipartReader()
        if err != nil {
            http.Error(w, "expected multipart/form-data", http.StatusBadRequest)
            return
        }

        var channelID, title, description, subtitleURL string
        var order int
        // episodeID allocated first so we can compute outputPath
        episodeID := bson.NewObjectID()
        outputDir := filepath.Join(hlsRoot, episodeID.Hex())
        _ = os.MkdirAll(outputDir, 0755)

        for {
            part, err := mr.NextPart()
            if err == io.EOF {
                break
            }
            if err != nil {
                http.Error(w, "multipart read error", http.StatusBadRequest)
                return
            }
            switch part.FormName() {
            case "channel_id":
                buf, _ := io.ReadAll(part)
                channelID = strings.TrimSpace(string(buf))
            case "title":
                buf, _ := io.ReadAll(part)
                title = strings.TrimSpace(string(buf))
            // ... other text fields
            case "file":
                dst, err := os.Create(filepath.Join(outputDir, "source.mp4"))
                if err != nil {
                    http.Error(w, "failed to create output file", http.StatusInternalServerError)
                    return
                }
                defer dst.Close()
                if _, err := io.Copy(dst, part); err != nil {
                    // MaxBytesReader will return a specific error on size exceeded
                    http.Error(w, "file write error: "+err.Error(), http.StatusRequestEntityTooLarge)
                    return
                }
            }
        }

        // Insert Episode, create Job with source="upload", Enqueue()
        // Same as CreateEpisode but with pre-allocated episodeID and source_url=""
    }
}
```

**Key decision:** Allocate the `episodeID` (`bson.NewObjectID()`) before processing the multipart stream so the output directory path is known during the file part — avoids a two-phase write.

### Pattern 2: XHR Upload with Progress in React

**What:** Use `XMLHttpRequest` directly (not `fetch`) to gain access to `xhr.upload.onprogress`.

**When to use:** Any upload where a progress bar is required. Fetch API does not expose upload progress.

```typescript
// In admin-app episode form — 'use client' component
function uploadFile(
  file: File,
  metadata: EpisodeMetadata,
  onProgress: (pct: number, loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('channel_id', metadata.channelId)
    formData.append('title', metadata.title)
    formData.append('description', metadata.description)
    formData.append('order', String(metadata.order))
    formData.append('subtitle_url', metadata.subtitleUrl)
    formData.append('file', file) // file part LAST — Go reads text fields before file

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/episodes/upload')
    xhr.withCredentials = true  // send admin_token cookie

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100)
        onProgress(pct, event.loaded, event.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 202) resolve()
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}
```

**Note:** Do NOT set `Content-Type` header manually when using `FormData` with XHR — the browser must set it automatically to include the `boundary` parameter. Manually setting it breaks multipart parsing.

### Pattern 3: nginx Location Blocks for Per-Extension Cache Headers

**What:** Split the existing `/hls/` location into nested regex sub-locations for `.ts` and `.m3u8`.

**Critical pitfall:** `add_header` is NOT inherited by child location blocks — any child block that uses `add_header` silently drops all parent `add_header` directives. **All CORS headers must be repeated in every child location block.**

```nginx
# In nginx.conf — replace existing /hls/ block
location /hls/ {
    alias /var/www/hls/;

    # .ts segments: immutable (content-addressed, never change)
    location ~ \.ts$ {
        alias /var/www/hls/;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        # CORS headers MUST be repeated — not inherited from parent
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Range, Origin, Accept' always;
        add_header Access-Control-Expose-Headers 'Content-Length, Content-Range' always;
        types { video/mp2t ts; }
    }

    # .m3u8 playlists: no-cache (client must revalidate to get current playlist)
    location ~ \.m3u8$ {
        alias /var/www/hls/;
        add_header Cache-Control "no-cache" always;
        # CORS headers MUST be repeated
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Range, Origin, Accept' always;
        add_header Access-Control-Expose-Headers 'Content-Length, Content-Range' always;
        types { application/vnd.apple.mpegurl m3u8; }
    }

    # Fallback for other files in /hls/ (unlikely but safe)
    add_header Cache-Control "public, max-age=3600" always;
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Range, Origin, Accept' always;
    add_header Access-Control-Expose-Headers 'Content-Length, Content-Range' always;
}
```

**Alternative (simpler, avoids inheritance problem):** Use `map` in the `http` block:

```nginx
# http block
map $uri $hls_cache {
    ~\.ts$    "public, max-age=31536000, immutable";
    ~\.m3u8$  "no-cache";
    default   "public, max-age=3600";
}

# location block
location /hls/ {
    alias /var/www/hls/;
    add_header Cache-Control $hls_cache always;
    # CORS headers — single location, no inheritance issue
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Range, Origin, Accept' always;
    add_header Access-Control-Expose-Headers 'Content-Length, Content-Range' always;
    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
    }
}
```

**Recommendation:** Use the `map` approach. It avoids the inheritance trap entirely, keeps CORS in one place, and is simpler to audit. The `$hls_cache` variable is set per-request before the location block executes.

### Pattern 4: Worker Integration for Uploaded Files

**What:** The uploaded source file at `{hlsRoot}/{episodeID}/source.mp4` feeds the same `transcodeHLS()` function used by the YouTube path.

**When to use:** Any new ingestion source — upload, S3, etc.

The worker already has `processJob()` which:
1. Calls `yt-dlp` to download → `{hlsRoot}/{episodeID}/source.mp4`
2. Calls `transcodeHLS(ctx, outputPath, outDir)`
3. Removes source.mp4 after transcoding

For uploaded files, step 1 is already done by the upload handler. The worker needs to detect this and skip the yt-dlp step. Two clean approaches:

**Option A — Source field on Job (recommended):** Add `Source string` field to `models.Job` (`"youtube"` | `"upload"`). In `processJob()`, check `if req.Source == "upload" { skip yt-dlp step }`. `JobRequest` gets a `Source string` field.

**Option B — Sentinel URL:** Set `SourceURL = "file://{episodeID}"` and detect by prefix. Fragile — avoid.

**Recommendation:** Option A. Aligns with the CONTEXT.md decision to show "YouTube" vs "Upload" in the jobs list source column.

### Pattern 5: Tab UI in Episode Form

**What:** Add a `useState('youtube' | 'upload')` to the existing `[id]/page.tsx` to switch between two source input UIs.

The existing form is already `'use client'`. The tab state is local — no routing, no URL param. On form submit:
- If tab = `'youtube'` and `sourceUrl` is set → existing `createEpisode` server action (JSON body)
- If tab = `'upload'` and `file` is set → new `uploadEpisode()` function using XHR (cannot use server action because server actions use `fetch` internally with no progress event)

The "Upload File" tab replaces the YouTube URL input area with:
- A drop zone div with `onDrop`, `onDragOver`, `onDragLeave` handlers
- A hidden `<input type="file">` triggered on click
- A progress bar `<div>` with CSS width tied to upload percentage
- Estimated time remaining: track start time + bytes uploaded, compute `bytesRemaining / bytesPerMs`

### Anti-Patterns to Avoid

- **Buffering the upload in memory before writing:** Loading a 2GB file into `[]byte` before writing will OOM the container. Always stream with `io.Copy`.
- **Not setting `http.MaxBytesReader`:** Without this, a client can stream unlimited data and fill the disk.
- **Setting `Content-Type` header manually with XHR + FormData:** The browser must set it with the boundary. Manual override breaks multipart parsing on the server.
- **Using `fetch` for upload:** No `onprogress` event — cannot implement a progress bar.
- **Adding `add_header` in a child nginx location without repeating parent headers:** CORS headers will silently disappear from all matched responses.
- **Using `restart: always`:** Prevents manual stops from persisting through daemon restarts. `unless-stopped` is correct for production.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload progress | Custom chunk-based upload protocol | XHR `onprogress` | Browser handles chunking; XHR provides progress events natively |
| File type validation | Magic byte parsing | MIME type from `part.Header.Get("Content-Type")` + extension check | Good enough for admin-only UI; yt-dlp/ffmpeg will reject invalid formats anyway |
| Large file memory management | Custom buffer pool | `io.Copy` stdlib pattern | Go's `io.Copy` uses a 32KB internal buffer — already optimal |
| Restart automation | Custom systemd unit | Docker `restart: unless-stopped` | Docker handles this; systemd integration is unnecessary complexity |

**Key insight:** The upload feature is a thin adapter onto existing infrastructure. The yt-dlp download step in `processJob()` produces `source.mp4` — the upload handler produces the same file in the same place. The rest of the pipeline (transcoding, job status, jobs list) is identical.

---

## Common Pitfalls

### Pitfall 1: nginx add_header Inheritance

**What goes wrong:** You add `add_header Cache-Control "..."` inside a nested `location ~ \.ts$` block and all CORS headers set in the parent `/hls/` block silently vanish from `.ts` responses. Video.js requests fail with CORS errors.

**Why it happens:** nginx's `add_header` directive is NOT inherited by child blocks that define their own `add_header`. Child blocks replace parent headers entirely.

**How to avoid:** Use the `map` directive pattern — set cache value via variable, keep all `add_header` directives in a single location block. Alternatively, repeat all parent headers verbatim in each child block.

**Warning signs:** After adding cache tuning, check browser DevTools Network tab for OPTIONS preflight — if CORS headers are missing on `.ts` requests, this is the cause.

### Pitfall 2: MaxBytesReader Error Handling

**What goes wrong:** When a client sends more than 2GB, `io.Copy` returns an error. The error message from `http.MaxBytesReader` is `"http: request body too large"` — not a clear HTTP 413. The response code may already be 200 (headers sent) before the limit is hit.

**Why it happens:** HTTP headers are sent before the full body is received. By the time `io.Copy` hits the limit, the 200 response header may already be written.

**How to avoid:** Write the response code explicitly only after fully processing the multipart parts. Use `defer` for cleanup. Log the error. Return a 413 with a JSON body if the limit error is detected before headers flush.

**Warning signs:** Upload fails silently at exactly 2GB mark; client receives partial response.

### Pitfall 3: XHR Cookie Authentication

**What goes wrong:** XHR upload to `/api/admin/episodes/upload` returns 401 because the `admin_token` cookie is not sent.

**Why it happens:** `xhr.withCredentials = true` must be set explicitly. It is not the default.

**How to avoid:** Always set `xhr.withCredentials = true` before `xhr.send()`. Confirm the nginx `/api/admin/` proxy preserves cookies (it already does via `proxy_set_header` — no change needed).

**Warning signs:** Upload handler logs show missing Authorization header; response is 401.

### Pitfall 4: FormData Field Order

**What goes wrong:** Go's `mr.NextPart()` reads parts in order. If the `file` part comes before text metadata parts, we don't have `channelID`, `title`, etc. when we need to allocate `episodeID` and create the output directory.

**Why it happens:** The browser sends FormData parts in the order they were `append()`ed. The Go handler must read them in the same order.

**How to avoid:** In the client, append text fields before the file: `formData.append('channel_id', ...)`, ..., `formData.append('file', file)` — file last. In the Go handler, read text fields first, then handle the file part. Pre-allocate `episodeID` before the multipart loop so the output dir is ready.

**Warning signs:** Episode insert fails with empty `channel_id` or `title`.

### Pitfall 5: Docker Volume Bind Mount on Reboot

**What goes wrong:** After a server reboot, `docker compose up` starts all services but files in `./data/hls` are not visible inside containers.

**Why it happens:** Bind mounts (not named volumes) depend on the host path existing. If Docker starts before the filesystem containing `./data` is mounted (e.g., a NAS or separate partition), the bind mount silently fails or mounts an empty directory.

**How to avoid:** Ensure `./data/hls` is on the root filesystem (not a separately mounted volume). The current setup uses `./data/hls` relative to the project — on a standard single-disk VPS this is safe. Verify during the smoke test that `ls /data/hls` inside `admin-api` shows expected files after reboot.

**Warning signs:** After reboot, nginx returns 404 for HLS segments that existed before reboot; `docker exec admin-api ls /data/hls` shows empty directory.

---

## Code Examples

### Upload handler skeleton (Go)

```go
// Source: research synthesis from https://leapcell.io/blog/handling-large-file-uploads-in-go-backends-with-streaming-and-temporary-files

// handler/upload.go
func UploadEpisode(database *mongo.Database, hlsRoot string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        const maxBytes = 2 * 1024 * 1024 * 1024 // 2 GiB
        r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

        mr, err := r.MultipartReader()
        if err != nil {
            jsonError(w, "expected multipart/form-data", http.StatusBadRequest)
            return
        }

        // Pre-allocate episode ID so output path is known before file part
        episodeID := bson.NewObjectID()
        outDir := filepath.Join(hlsRoot, episodeID.Hex())
        if err := os.MkdirAll(outDir, 0755); err != nil {
            jsonError(w, "failed to create output dir", http.StatusInternalServerError)
            return
        }

        var channelID, title, description, subtitleURL string
        var order int
        var fileWritten bool

        for {
            part, err := mr.NextPart()
            if err == io.EOF {
                break
            }
            if err != nil {
                jsonError(w, "multipart read error: "+err.Error(), http.StatusBadRequest)
                return
            }

            name := part.FormName()
            if name == "" {
                name = part.FileName() // file part uses FileName, not FormName
            }

            switch part.FormName() {
            case "channel_id":
                b, _ := io.ReadAll(io.LimitReader(part, 256))
                channelID = strings.TrimSpace(string(b))
            case "title":
                b, _ := io.ReadAll(io.LimitReader(part, 512))
                title = strings.TrimSpace(string(b))
            case "description":
                b, _ := io.ReadAll(io.LimitReader(part, 4096))
                description = strings.TrimSpace(string(b))
            case "order":
                b, _ := io.ReadAll(io.LimitReader(part, 16))
                order, _ = strconv.Atoi(strings.TrimSpace(string(b)))
            case "subtitle_url":
                b, _ := io.ReadAll(io.LimitReader(part, 512))
                subtitleURL = strings.TrimSpace(string(b))
            case "file":
                dst, err := os.Create(filepath.Join(outDir, "source.mp4"))
                if err != nil {
                    jsonError(w, "failed to create source file", http.StatusInternalServerError)
                    return
                }
                if _, err := io.Copy(dst, part); err != nil {
                    dst.Close()
                    jsonError(w, "file upload error: "+err.Error(), http.StatusRequestEntityTooLarge)
                    return
                }
                dst.Close()
                fileWritten = true
            }
        }

        if !fileWritten {
            jsonError(w, "no file received", http.StatusBadRequest)
            return
        }

        // Insert Episode + Job (source="upload"), Enqueue
        // ... (same pattern as CreateEpisode, status 202)
    }
}
```

### XHR upload with progress (TypeScript)

```typescript
// Source: https://openjavascript.info/2022/07/01/upload-progress-bar-using-xhr-fetch-alternative/

function uploadEpisode(
  file: File,
  fields: { channelId: string; title: string; description: string; order: number; subtitleUrl: string },
  callbacks: {
    onProgress: (pct: number, loaded: number, total: number) => void
    onComplete: () => void
    onError: (msg: string) => void
  }
) {
  const fd = new FormData()
  // Text fields FIRST — Go reads multipart in order
  fd.append('channel_id', fields.channelId)
  fd.append('title', fields.title)
  fd.append('description', fields.description)
  fd.append('order', String(fields.order))
  fd.append('subtitle_url', fields.subtitleUrl)
  fd.append('file', file)  // file LAST

  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/admin/episodes/upload')
  xhr.withCredentials = true  // REQUIRED: send admin_token cookie
  // Do NOT set Content-Type — browser sets it with boundary automatically

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      callbacks.onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total)
    }
  }
  xhr.onload = () => {
    if (xhr.status === 202) callbacks.onComplete()
    else callbacks.onError(`${xhr.status}: ${xhr.responseText}`)
  }
  xhr.onerror = () => callbacks.onError('Network error')
  xhr.send(fd)
}
```

### nginx map approach for HLS cache tuning

```nginx
# Source: nginx.org/en/docs/http/ngx_http_map_module.html

# In http { } block — BEFORE server { } block
map $uri $hls_cache_control {
    ~\.ts$    "public, max-age=31536000, immutable";
    ~\.m3u8$  "no-cache";
    default   "public, max-age=3600";
}

# In server { } block — replaces existing /hls/ location
location /hls/ {
    alias /var/www/hls/;

    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t                     ts;
    }

    # Single set of add_header directives — no inheritance problem
    add_header Cache-Control $hls_cache_control always;
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Range, Origin, Accept' always;
    add_header Access-Control-Expose-Headers 'Content-Length, Content-Range' always;
}
```

### Job model extension

```go
// Source: models/job.go — add Source field

type Job struct {
    ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
    EpisodeID   bson.ObjectID `bson:"episode_id" json:"episode_id"`
    SourceURL   string        `bson:"source_url" json:"source_url"`
    Source      string        `bson:"source" json:"source"`  // "youtube" | "upload"
    Status      JobStatus     `bson:"status" json:"status"`
    Error       string        `bson:"error" json:"error"`
    StartedAt   *time.Time    `bson:"started_at,omitempty" json:"started_at"`
    CompletedAt *time.Time    `bson:"completed_at,omitempty" json:"completed_at"`
    CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
    UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}
```

### JobRequest extension for worker

```go
// Source: worker/processor.go — extend JobRequest

type JobRequest struct {
    JobID     bson.ObjectID
    EpisodeID bson.ObjectID
    SourceURL string
    Source    string  // "youtube" | "upload"
}
```

In `processJob()`:

```go
// Skip yt-dlp download if source file already exists (upload path)
if req.Source != "upload" {
    // Step 2: download via yt-dlp
    // ... existing yt-dlp code
} else {
    // File already at outputPath from upload handler
    // Mark as transcoding directly
    updateJobStatus(ctx, database, req.JobID, models.JobStatusTranscoding, "")
}
// Step 3+: transcodeHLS — same for both paths
```

### Docker smoke test sequence

```bash
# After confirming all services healthy post-reboot:
# 1. Check all 6 services are running
docker compose ps

# 2. Verify HLS volume contents survive reboot
docker compose exec admin-api ls /data/hls

# 3. Hit nginx healthz
curl -f http://localhost/healthz

# 4. Hit site-api healthz via nginx proxy
curl -f http://localhost/api/site/healthz

# 5. Hit admin-api healthz via nginx proxy
curl -f http://localhost/api/admin/healthz

# 6. Verify .ts cache header
curl -sI http://localhost/hls/{episode_id}/0/seg000.ts | grep Cache-Control
# Expected: Cache-Control: public, max-age=31536000, immutable

# 7. Verify .m3u8 no-cache header
curl -sI http://localhost/hls/{episode_id}/master.m3u8 | grep Cache-Control
# Expected: Cache-Control: no-cache
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `r.ParseMultipartForm(32MB)` — stores excess in OS temp | `r.MultipartReader()` streaming — no temp files | Always an option; streaming preferred for >100MB | Avoids disk I/O to system temp; writes directly to final location |
| Fetch API for file upload | XHR for upload progress | Fetch never had upload progress (2024+) | XHR is the correct tool; no sign of Fetch gaining it |
| nginx add_header in nested locations | nginx map directive for per-extension headers | Longstanding nginx behavior | Simpler, more maintainable, avoids inheritance trap |

**Deprecated/outdated:**
- `ioutil.ReadAll` for reading multipart text fields: use `io.ReadAll` (since Go 1.16)
- `primitive.ObjectID` (mongo-driver v1): use `bson.ObjectID` — already correct in this codebase

---

## Open Questions

1. **Upload timeout on nginx proxy**
   - What we know: nginx has a default `proxy_read_timeout 60s` for upstream responses. A 2GB upload via multipart to admin-api might take several minutes on slow connections.
   - What's unclear: Whether the timeout applies to the upload direction (client→nginx→admin-api) or just the response direction.
   - Recommendation: Add `client_max_body_size 2100m` and `proxy_read_timeout 600s` (or `proxy_send_timeout`) to the `/api/admin/episodes/upload` location in nginx. Default `client_max_body_size` is 1MB — this WILL block 2GB uploads unless raised.

2. **Partial upload cleanup**
   - What we know: If the upload is interrupted mid-stream, `source.mp4` will be an incomplete file in `/data/hls/{episodeID}/`.
   - What's unclear: Whether the episode/job documents get created before or after the file write completes.
   - Recommendation: Create episode + job documents AFTER the file is fully written (file write is the last step in the handler). On error, delete the partial directory with `os.RemoveAll(outDir)`.

3. **nginx `client_max_body_size` for upload endpoint**
   - What we know: The default is 1MB and will reject 2GB uploads with 413.
   - What's unclear: Whether to set it globally or per-location.
   - Recommendation: Set `client_max_body_size 2100m` on the specific upload proxy location only, not globally, to avoid creating a large-body attack surface on other endpoints.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (key absent). Skipping this section.

---

## Sources

### Primary (HIGH confidence)
- Go stdlib `net/http`, `io`, `os` — streaming multipart upload patterns verified against official package docs
- nginx.org/en/docs/http/ngx_http_headers_module.html — `add_header` directive behavior, `always` parameter, inheritance rules
- nginx.org/en/docs/http/ngx_http_map_module.html — `map` directive for per-extension variables
- Existing codebase: `/backend/internal/worker/processor.go`, `/backend/internal/handler/episode.go`, `/docker-compose.yml`, `/nginx/nginx.conf` — all read and verified

### Secondary (MEDIUM confidence)
- [Leapcell: Handling Large File Uploads in Go](https://leapcell.io/blog/handling-large-file-uploads-in-go-backends-with-streaming-and-temporary-files) — streaming patterns, `MaxBytesReader` usage verified against stdlib
- [GetPageSpeed: nginx add_header Pitfalls](https://www.getpagespeed.com/server-setup/nginx/the-pitfalls-of-add_header-in-nginx-solving-inheritance-issues-with-more_set_headers) — inheritance behavior confirmed against nginx docs
- [OpenJavaScript: XHR Upload Progress](https://openjavascript.info/2022/07/01/upload-progress-bar-using-xhr-fetch-alternative/) — `xhr.upload.onprogress` pattern; Fetch API lacks upload progress is longstanding browser spec behavior
- Docker Compose restart policy docs — `unless-stopped` behavior confirmed

### Tertiary (LOW confidence)
- None — all critical claims verified against official sources or codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing dependencies; no new libraries
- Architecture: HIGH — patterns verified against existing codebase conventions and official docs
- Pitfalls: HIGH — add_header inheritance verified against nginx docs; XHR vs fetch verified against browser specs; file order pitfall derived from Go multipart mechanics

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable nginx/Go/Docker ecosystem; no fast-moving dependencies)
