# Phase 7: Fix Auth & Routing Wiring Bugs - Research

**Researched:** 2026-03-01
**Domain:** Go chi/jwtauth middleware, Next.js 16 proxy file convention
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIDE-04 | Job status (pending/downloading/transcoding/ready/failed) is visible in admin panel with real-time updates | Admin-api cookie extractor fix enables client-side `apiFetch` polling to authenticate; jobs page `setInterval` loop already written correctly |
| ADMN-02 | Admin API endpoints are protected by JWT authentication | Cookie extractor pattern from site-api is directly reusable; `jwtauth.Verify` variadic API confirmed in jwtauth v5.4.0 source |
</phase_requirements>

---

## Summary

Phase 7 addresses two integration wiring bugs identified in the v1.0 milestone audit. Both bugs are shallow — each involves a single small code change that wires up an already-correct design. No new libraries are needed. No architectural changes are required.

**Bug 1 (VIDE-04 + ADMN-02): admin-api missing cookie extractor.** `admin-app` client-side `apiFetch` sends the `admin_token` cookie via `credentials: 'include'`, but `admin-api` uses `jwtauth.Verifier(auth.TokenAuth)` which only reads `Authorization: Bearer` header (and a hardcoded `jwt` cookie — NOT `admin_token`). The fix is a two-line change in `backend/cmd/admin-api/main.go`: add a `tokenFromAdminCookie` closure and switch from `jwtauth.Verifier` to `jwtauth.Verify` with both `TokenFromHeader` and the cookie closure. This is an exact copy of the pattern already used in `site-api`.

**Bug 2 (site-app route guard inactive): proxy.ts registration.** The `site-app/src/proxy.ts` file is named correctly per Next.js 16 (where `proxy.ts` replaced `middleware.ts`) and exports the correct named function `proxy`. The `middleware-manifest.json` in the local `.next/` directory is empty, but this build artifact is stale — the `.next` directory is gitignored and not used in Docker. The Docker build always runs `npm run build` fresh. The root cause of the empty manifest in the local build is a stale build done before or independently of the code state. The fix is to verify the Docker build produces a non-empty manifest (no code change should be needed). However, if the Docker build also produces an empty manifest, a default export form of the proxy function is the safe fallback (both named and default exports are valid per Next.js 16 docs).

**Primary recommendation:** Fix Bug 1 by adding `tokenFromAdminCookie` to `backend/cmd/admin-api/main.go` (exact same closure used in site-api). Verify Bug 2 by rebuilding the Docker image and checking `middleware-manifest.json`; only change the proxy.ts export style if the manifest remains empty.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| github.com/go-chi/jwtauth/v5 | v5.4.0 | JWT verification middleware for chi | `jwtauth.Verify` accepts variadic `func(r *http.Request) string` finders |
| next | 16.1.6 | Next.js framework | `proxy.ts` is the correct file convention; replaces deprecated `middleware.ts` |

### No Installation Required

Both bugs are wiring gaps in existing code. No new packages needed.

---

## Architecture Patterns

### Pattern 1: jwtauth.Verify with Custom Cookie Finder

**What:** Replace `jwtauth.Verifier` (which reads a hardcoded `jwt` cookie) with `jwtauth.Verify` (which accepts variadic token finder functions). Add a closure that reads the specific cookie name.

**When to use:** Any chi service where the JWT cookie name is not `jwt`.

**Source:** `/Users/hadi/Documents/Self/kidtube/backend/cmd/site-api/main.go` (lines 66-77) — already working in production for site-api.

```go
// tokenFromAdminCookie reads the admin_token cookie for browser-based auth.
// Mirrors the tokenFromSiteCookie pattern in site-api/main.go.
tokenFromAdminCookie := func(r *http.Request) string {
    cookie, err := r.Cookie("admin_token")
    if err != nil {
        return ""
    }
    return cookie.Value
}

// Protected routes — require valid JWT
r.Group(func(r chi.Router) {
    // jwtauth.Verify (not Verifier) so we can pass our custom cookie finder.
    // Order: Authorization: Bearer header first, then admin_token cookie.
    r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromAdminCookie))
    r.Use(jwtauth.Authenticator(auth.TokenAuth))
    // ... routes unchanged
})
```

### Pattern 2: Next.js 16 proxy.ts Convention

**What:** In Next.js 16, `proxy.ts` (with `export function proxy()` or `export default function proxy()`) replaces the deprecated `middleware.ts`. Both named and default exports are valid.

**When to use:** Route guard logic that must run on every matching request before page render.

**Source:** https://nextjs.org/docs/app/api-reference/file-conventions/proxy (Next.js 16.1.6 official docs)

```typescript
// src/proxy.ts — correctly named for Next.js 16
import { NextRequest, NextResponse } from 'next/server'

// Named export 'proxy' IS valid per docs:
// "The file must export a single function, either as a default export or named 'proxy'."
export function proxy(request: NextRequest) {
  // ... guard logic
}

export const config = {
  matcher: ['/protected/:path*'],
}
```

### Anti-Patterns to Avoid

- **Using `jwtauth.Verifier` with custom cookie names:** `jwtauth.Verifier(ja)` expands to `jwtauth.Verify(ja, TokenFromHeader, TokenFromCookie)` where `TokenFromCookie` hardcodes the `"jwt"` cookie name. For any other cookie name, use `jwtauth.Verify` with a custom finder.
- **Renaming `proxy.ts` to `middleware.ts` in Next.js 16:** This is the wrong direction. `middleware.ts` is deprecated in Next.js 16. The correct file name is `proxy.ts`. The upgrade guide says to rename `middleware.ts` → `proxy.ts`, not the reverse.
- **Passing cookies via server-side apiFetch:** Server actions already correctly use `Authorization: Bearer` via `getAuthHeader()`. Only client-side `apiFetch` sends cookies. Do NOT change server action auth flow.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT cookie extraction | Custom cookie-reading middleware | jwtauth.Verify + inline closure | Library handles all error cases; pattern already proven in site-api |
| Token validation | Manual jwt.Parse calls | jwtauth.Authenticator | Handles nil token, context propagation, 401 response |

**Key insight:** The jwtauth.Verify variadic API is specifically designed for multi-source token extraction. The site-api already demonstrates this pattern working correctly for the `site_token` cookie. Copying it for `admin_token` is the entire fix.

---

## Common Pitfalls

### Pitfall 1: Touching the Authenticator Middleware

**What goes wrong:** Changing `jwtauth.Authenticator(auth.TokenAuth)` alongside `Verifier` → `Verify` when only the Verifier needs changing.

**Why it happens:** The two middleware are easily confused.

**How to avoid:** Only change the `Verifier` → `Verify` call (line 75 of admin-api/main.go). Leave `Authenticator` unchanged. Verify = extracts and verifies token. Authenticator = rejects requests with invalid/missing tokens.

**Warning signs:** If protected routes start returning 500 instead of 401, the Authenticator was accidentally altered.

### Pitfall 2: Renaming proxy.ts to middleware.ts

**What goes wrong:** The audit's recommended fix for Bug 2 is "rename proxy.ts to middleware.ts". This is WRONG for Next.js 16 — `middleware.ts` is deprecated and `proxy.ts` is the correct name.

**Why it happens:** The audit was generated before verifying current Next.js 16 docs.

**How to avoid:** Keep `proxy.ts`. Verify Docker build produces non-empty `middleware-manifest.json`. If empty, check that: (1) export is named `proxy` or is default export, (2) file is at `src/proxy.ts` (not nested deeper), (3) `config.matcher` has correct paths.

**Warning signs:** The build output should log something like "Proxy detected at src/proxy.ts" or similar. If no such message appears and manifest is still empty, try changing to `export default function proxy()`.

### Pitfall 3: Breaking Server Action Auth

**What goes wrong:** Modifying admin-api auth to ONLY read cookies, breaking server actions that send `Authorization: Bearer`.

**Why it happens:** Over-correction — thinking the fix is cookie-only.

**How to avoid:** The fix is `jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromAdminCookie)` — BOTH header AND cookie, in that order. Server actions continue to use Bearer header; client polling uses cookie. Both work.

### Pitfall 4: Wrong Cookie Path in admin-app

**What goes wrong:** Assuming the cookie path needs to change. The `admin_token` cookie is already set with `path: '/'` (confirmed in `admin-app/src/lib/session.ts` line 11).

**Why it happens:** Debugging auth issues often leads to examining cookie config unnecessarily.

**How to avoid:** The cookie path is already correct. Do not change `session.ts`. The only fix is on the admin-api side.

### Pitfall 5: Missing Rebuild After Fix

**What goes wrong:** Verifying the site-app proxy fix by checking the local `.next/server/middleware-manifest.json` instead of rebuilding.

**Why it happens:** The `.next` directory is gitignored; its contents are stale from an earlier local build.

**How to avoid:** After any proxy.ts change, rebuild the Docker image (`docker compose build site-app`) and check the manifest inside the running container, or check `.next/server/middleware-manifest.json` after a fresh `npm run build`.

---

## Code Examples

Verified patterns from official/local sources:

### Fix 1: admin-api/main.go — Add Cookie Extractor

```go
// Source: /Users/hadi/Documents/Self/kidtube/backend/cmd/site-api/main.go (mirror pattern)
// In backend/cmd/admin-api/main.go, BEFORE the r.Group protected routes block:

// tokenFromAdminCookie reads the admin_token cookie for browser-based auth.
// Client-side apiFetch in admin-app sends credentials:'include' (no Bearer header).
tokenFromAdminCookie := func(r *http.Request) string {
    cookie, err := r.Cookie("admin_token")
    if err != nil {
        return ""
    }
    return cookie.Value
}

// Protected routes — require valid JWT
r.Group(func(r chi.Router) {
    // CHANGED: jwtauth.Verifier → jwtauth.Verify with custom cookie finder
    r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromAdminCookie))
    r.Use(jwtauth.Authenticator(auth.TokenAuth))
    // All routes below remain unchanged
    r.Route("/channels", func(r chi.Router) { /* ... */ })
    // ...
})
```

### Fix 2: Verify proxy.ts is Correctly Registered

```bash
# After rebuilding Docker image, check the manifest inside container:
docker compose exec site-app cat /app/.next/server/middleware-manifest.json
# Expected: {"version":3,"middleware":{"/":{"...}},"sortedMiddleware":["/"],...}
# Bug confirmed if: {"version":3,"middleware":{},"sortedMiddleware":[],"functions":{}}
```

If manifest remains empty after Docker rebuild, try switching to default export:

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
// Alternative export style (functionally identical, safer for older Turbopack):
export default function proxy(request: NextRequest) {
  // ... existing logic unchanged
}
// (keep export const config = { matcher: [...] } unchanged)
```

### jwtauth.Verify Signature (from source)

```go
// Source: /Users/hadi/go/pkg/mod/github.com/go-chi/jwtauth/v5@v5.4.0/jwtauth.go line 74
func Verify(ja *JWTAuth, findTokenFns ...func(r *http.Request) string) func(http.Handler) http.Handler

// jwtauth.Verifier(ja) is shorthand for:
func Verifier(ja *JWTAuth) func(http.Handler) http.Handler {
    return Verify(ja, TokenFromHeader, TokenFromCookie) // TokenFromCookie reads hardcoded "jwt" cookie
}

// TokenFromHeader reads Authorization: Bearer <token>
// TokenFromCookie reads the "jwt" cookie (hardcoded name — NOT "admin_token")
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export function middleware()` | `proxy.ts` + `export function proxy()` | Next.js 16.0.0 | middleware.ts deprecated; proxy.ts is the correct file name |
| `jwtauth.Verifier(ja)` for cookie-based auth | `jwtauth.Verify(ja, TokenFromHeader, customCookieFn)` for named cookies | N/A (always been this way) | Verifier hardcodes "jwt" cookie; Verify is the flexible API |

**Deprecated/outdated:**
- `middleware.ts` filename: deprecated in Next.js 16, still works (edge runtime only) but `proxy.ts` is the correct replacement
- `jwtauth.Verifier` with non-standard cookie names: works only when the cookie is named `"jwt"` — use `jwtauth.Verify` with a custom finder for any other cookie name

---

## Open Questions

1. **Why is the local site-app middleware-manifest.json empty if proxy.ts is correctly named?**
   - What we know: Next.js 16.1.6 uses `PROXY_FILENAME = 'proxy'`, detects files at root or `/src`, and the file `site-app/src/proxy.ts` with `export function proxy()` matches all criteria
   - What's unclear: The local build was generated at some point with Turbopack; there may be a Turbopack-specific quirk with the named `proxy` export vs default export
   - Recommendation: After rebuilding Docker image, if manifest is still empty, switch `site-app/src/proxy.ts` to use `export default function proxy()` — both forms are valid per docs and the default export is more explicitly supported in older Turbopack

2. **Does admin-app's proxy.ts have the same registration issue?**
   - What we know: `admin-app/.next/server/middleware-manifest.json` is also empty, but admin-app's proxy guards the login redirect (already working per audit) since the audit only flagged site-app's guest redirect
   - What's unclear: Whether the admin-app proxy is also not active, or whether the login redirect works via other means (server-side in login page/layout)
   - Recommendation: Focus the verification on site-app; admin-app route guard is out of scope for Phase 7 unless it surfaces as broken

---

## Sources

### Primary (HIGH confidence)

- `/Users/hadi/go/pkg/mod/github.com/go-chi/jwtauth/v5@v5.4.0/jwtauth.go` — `Verifier`, `Verify`, `TokenFromCookie`, `TokenFromHeader` function signatures confirmed directly from source
- `/Users/hadi/Documents/Self/kidtube/backend/cmd/site-api/main.go` — working `tokenFromSiteCookie` pattern confirmed in production code
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy — Next.js 16.1.6 official docs confirming `proxy.ts` file name, named `proxy` export, and `config.matcher`
- https://nextjs.org/blog/next-16 — Next.js 16 release notes confirming `proxy.ts` replaces `middleware.ts`
- https://nextjs.org/docs/app/guides/upgrading/version-16 — upgrade guide confirming `mv middleware.ts proxy.ts` and edge runtime NOT supported in proxy

### Secondary (MEDIUM confidence)

- `/Users/hadi/Documents/Self/kidtube/site-app/node_modules/next/dist/build/index.js` — `PROXY_FILENAME = 'proxy'` and detection logic (`isAtConventionLevel = normalizedFileDir === '/' || normalizedFileDir === '/src'`) verified in installed package source
- `/Users/hadi/Documents/Self/kidtube/.planning/v1.0-MILESTONE-AUDIT.md` — audit's description of both bugs and their symptoms

### Tertiary (LOW confidence)

- Local `.next/server/middleware-manifest.json` showing empty middleware — this is a stale local build, not a Docker build; take with caution when debugging

---

## Metadata

**Confidence breakdown:**
- Bug 1 (admin-api cookie extractor): HIGH — jwtauth source confirmed, site-api pattern confirmed, exact fix is clear
- Bug 2 (proxy.ts registration): MEDIUM — Next.js 16 docs confirm proxy.ts is correct naming; local empty manifest may be stale build artifact; Docker rebuild should resolve; fallback (default export) is documented
- Pitfalls: HIGH — derived from direct code analysis and official docs

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable libraries — jwtauth v5.4.0, Next.js 16.1.6)
