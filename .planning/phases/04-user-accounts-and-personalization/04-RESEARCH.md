# Phase 4: User Accounts and Personalization - Research

**Researched:** 2026-03-01
**Domain:** JWT authentication (site-api), HttpOnly cookies, subscriptions/bookmarks (MongoDB + Go), Next.js 16 auth state (React 19)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Registration & Login Flow**
- Dedicated pages at `/login` and `/register` (not modals) — consistent with existing site-app routing
- No email verification for v1 — register and immediately use all account features
- Registration collects email + password only — minimal friction
- Centered card with logo on a subtle background — clean, kid-friendly, matches existing site style
- All form labels and error messages in Persian RTL

**Subscribe & Bookmark UX**
- Subscribe action is a text button: "عضویت" (Subscribe) that toggles to "عضو هستید" (Subscribed) — clear and accessible for kids
- Bookmark action is a bookmark icon on episode cards and on the watch page — tap to save, fills when bookmarked
- Dedicated separate pages: `/subscriptions` and `/bookmarks` accessible from the profile dropdown menu
- Guest tapping subscribe/bookmark gets redirected to `/login` with a return URL so they come back after logging in

**Guest vs Logged-in Navigation**
- Guest sees a "ورود / ثبت‌نام" (Login/Register) button in the header
- Logged-in user sees a small avatar/initial circle replacing the login button; dropdown opens with links to subscriptions, bookmarks, and logout
- Sign-up CTA is subtle — just the header button, not pushy (kids platform shouldn't pressure sign-ups)
- Homepage shows a personalized "کانال‌های من" (My Channels) rail at the top for logged-in users with their subscribed channels

**Account Info & Profile**
- Minimal settings page showing email with a change-password form — no profile customization for v1
- Admin users table shows: email, registration date, login status — basic visibility for v1

### Claude's Discretion
- Exact password validation rules (minimum length, complexity)
- Avatar/initial circle design and color assignment
- Loading states and error handling patterns
- Form validation UX (inline vs. on-submit)
- Empty state illustrations for subscriptions/bookmarks pages
- Admin users table pagination and sorting

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can register with email and password | New `POST /auth/register` on site-api; bcrypt hash; unique email index already exists in MongoDB |
| AUTH-02 | User can log in and receive a JWT token (HttpOnly cookie) | Mirror admin-api Login handler for site users; issue JWT with role="user"; set cookie via Next.js server action |
| AUTH-03 | User session persists across browser refresh | HttpOnly cookie with 7-day maxAge (same pattern as admin_token); server-side cookie read on each request |
| AUTH-04 | All content is viewable without login — accounts are optional | Already complete (Phase 3). No change needed; protected endpoints must be additive only |
| AUTH-05 | Logged-in user can subscribe to channels | New `subscriptions` MongoDB collection; `POST/DELETE /me/subscriptions/{channel_id}` on site-api; middleware validates site JWT |
| AUTH-06 | Logged-in user can bookmark episodes | New `bookmarks` MongoDB collection; `POST/DELETE /me/bookmarks/{episode_id}` on site-api; middleware validates site JWT |
| ADMN-03 | Admin can view registered users | New `GET /users` on admin-api (protected by existing jwtauth middleware); new `/admin/users` page in admin-app |
</phase_requirements>

---

## Summary

Phase 4 layers optional user accounts on top of the fully-public Phase 3 site. The Go backend already has all the infrastructure needed: `jwtauth/v5` for token signing/verification, `bcrypt` for password hashing (used in admin Login handler), the `users` collection with a unique email index, and the chi router pattern for protected routes. Phase 4 simply extends site-api with auth endpoints and personalization endpoints, mirrors the admin-api cookie session pattern in site-app, and adds React UI for subscribe/bookmark/profile.

The most critical architectural decision is **where to store the site JWT**. Admin-api returns a token as JSON and the admin-app server action writes it as an HttpOnly cookie — the same pattern must be replicated for site users. The site-api `POST /auth/login` returns a token JSON body; the site-app Next.js server action calls it and writes a `site_token` HttpOnly cookie. All subsequent authenticated API calls on the client use `credentials: 'include'`; server components read the cookie and forward it as `Authorization: Bearer`.

The subscribe/bookmark data model needs two new collections: `subscriptions` (`{user_id, channel_id, created_at}`) and `bookmarks` (`{user_id, episode_id, created_at}`). Both need compound unique indexes on `(user_id, channel_id)` and `(user_id, episode_id)` respectively to prevent duplicates and to enable fast `GET /me/subscriptions` and `GET /me/bookmarks` list queries.

**Primary recommendation:** Replicate the proven admin-api/admin-app auth pattern verbatim for site-api/site-app — same JWT library, same bcrypt, same HttpOnly cookie via Next.js server action — then add minimal personalization endpoints following the existing site handler conventions.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `go-chi/jwtauth/v5` | v5.4.0 (already in go.mod) | JWT signing/verification in Go | Already used by admin-api; same `auth.TokenAuth` singleton can be used by site-api via shared `internal/auth` package |
| `golang.org/x/crypto/bcrypt` | v0.38.0 (already in go.mod) | Password hashing | Already used by admin Login handler; use same `bcrypt.GenerateFromPassword` / `CompareHashAndPassword` pattern |
| `go.mongodb.org/mongo-driver/v2` | v2.5.0 (already in go.mod) | MongoDB persistence | Already used everywhere; subscriptions/bookmarks are simple document inserts/deletes |
| `next` (cookies API) | 16.1.6 (already in package.json) | HttpOnly cookie management in server actions | `cookies()` from `next/headers` already used in `admin-app/src/lib/session.ts` — copy the pattern |
| `jose` | v6.1.3 (already in admin-app package.json) | JWT verification in Next.js middleware/proxy | Already used; site-app will need it for reading `site_token` in proxy.ts |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useActionState` (React 19 built-in) | React 19.2.3 | Form state management in client components | Already used in admin-app login page — use for site-app /login and /register forms |
| Tailwind v4 CSS | ^4 (already installed) | Styling avatar circle, dropdown, subscribe button | Already configured via `@theme` blocks in globals.css |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HttpOnly cookie (session.ts pattern) | localStorage / sessionStorage | localStorage is accessible to JS (XSS risk); HttpOnly cookie is the secure standard — use cookie |
| Shared `internal/auth` package | Duplicate JWT init in site-api | Duplication violates project convention; site-api imports same `internal/auth` package |
| Separate `subscriptions` collection | Embed arrays in User document | Embedded arrays don't scale; compound indexes on separate collection enable efficient per-user queries |

**Installation:** No new packages needed for the backend. For site-app, `jose` may need to be added:

```bash
cd site-app && npm install jose
```

---

## Architecture Patterns

### Recommended Project Structure

**Backend additions (backend/internal/):**
```
handler/
├── site_auth.go          # Register, Login handlers for site users
├── site_me.go            # GET /me, subscriptions, bookmarks handlers
├── site_channel.go       # (existing) + subscribe state in response (optional)
├── admin_users.go        # GET /users handler for admin-api
models/
├── subscription.go       # Subscription struct {UserID, ChannelID, CreatedAt}
├── bookmark.go           # Bookmark struct {UserID, EpisodeID, CreatedAt}
db/
├── mongo.go              # (update) Add CollSubscriptions, CollBookmarks constants + indexes
```

**site-api routing additions (cmd/site-api/main.go):**
```
Public:
  POST /auth/register
  POST /auth/login
  DELETE /auth/logout     (clears cookie — server action calls this)

Protected (site JWT required):
  GET  /me                # returns current user email
  GET  /me/subscriptions  # list subscribed channels
  POST /me/subscriptions/{channel_id}
  DELETE /me/subscriptions/{channel_id}
  GET  /me/bookmarks      # list bookmarked episodes
  POST /me/bookmarks/{episode_id}
  DELETE /me/bookmarks/{episode_id}
  PUT  /me/password       # change password
```

**admin-api routing addition (cmd/admin-api/main.go):**
```
Protected (existing jwtauth middleware):
  GET /users              # list all users for admin
```

**site-app additions:**
```
src/
├── app/
│   ├── login/page.tsx            # /login — Persian RTL card
│   ├── register/page.tsx         # /register — Persian RTL card
│   ├── account/page.tsx          # /account — email + change password
│   ├── subscriptions/page.tsx    # /subscriptions — "کانال‌های من"
│   ├── bookmarks/page.tsx        # /bookmarks — saved episodes
│   └── actions/
│       └── auth.ts               # register, login, logout server actions
├── lib/
│   ├── session.ts                # createSiteSession, getSiteSession, deleteSiteSession
│   └── api.ts                    # (update) authFetch — apiFetch + credentials:include + Bearer header
└── components/
    ├── TopNavbar.tsx             # (update) guest/auth button, avatar circle + dropdown
    ├── BottomTabBar.tsx          # (update) add "کتابخانه" tab or profile tab
    ├── SubscribeButton.tsx       # 'use client' toggle button
    └── BookmarkButton.tsx        # 'use client' bookmark icon toggle
```

**admin-app additions:**
```
src/
└── app/
    └── users/
        └── page.tsx              # /admin/users — users DataTable
```

### Pattern 1: Site Auth — Register Handler (Go)

**What:** Accept email+password, hash with bcrypt, insert into users collection, return 201.
**When to use:** POST /auth/register

```go
// Source: mirrors backend/internal/handler/auth.go Login pattern
type registerRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

func Register(database *mongo.Database) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req registerRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid request body", http.StatusBadRequest)
            return
        }
        if req.Email == "" || req.Password == "" {
            http.Error(w, "email and password are required", http.StatusBadRequest)
            return
        }
        if len(req.Password) < 8 {
            http.Error(w, "password must be at least 8 characters", http.StatusBadRequest)
            return
        }

        hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            http.Error(w, "failed to hash password", http.StatusInternalServerError)
            return
        }

        now := time.Now()
        user := models.User{
            Email:        req.Email,
            PasswordHash: string(hash),
            Role:         "user",
            CreatedAt:    now,
            UpdatedAt:    now,
        }
        _, err = database.Collection(db.CollUsers).InsertOne(r.Context(), user)
        if mongo.IsDuplicateKeyError(err) {
            http.Error(w, "email already registered", http.StatusConflict)
            return
        }
        if err != nil {
            http.Error(w, "failed to register user", http.StatusInternalServerError)
            return
        }

        w.WriteHeader(http.StatusCreated)
    }
}
```

### Pattern 2: Site Auth — Login Handler (Go) — Returns Token JSON

**What:** Authenticate site user, return JWT token as JSON (identical to existing admin Login but role="user").
**When to use:** POST /auth/login on site-api

```go
// Same as admin Login but filter role:"user" (not "admin")
// Returns {"token": "<jwt>"} — site-app server action writes it to HttpOnly cookie
filter := bson.D{
    {Key: "email", Value: req.Email},
    {Key: "role", Value: "user"},
}
// ... bcrypt check, auth.IssueToken(user.ID.Hex(), "user")
```

**Key difference from admin Login:** role filter is `"user"`, not `"admin"`.

### Pattern 3: Protected Endpoint — Extract User ID from JWT (Go)

**What:** site-api uses jwtauth middleware; handlers extract user_id from JWT claims.
**When to use:** All `/me/*` handlers

```go
// Source: go-chi/jwtauth/v5 — same library already in go.mod
import "github.com/go-chi/jwtauth/v5"

func GetMe(database *mongo.Database) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        _, claims, _ := jwtauth.FromContext(r.Context())
        userIDStr, _ := claims["user_id"].(string)
        userOID, err := bson.ObjectIDFromHex(userIDStr)
        // ... fetch user, respond
    }
}
```

Site-api's protected group in main.go:
```go
auth.Init() // already done; JWT_SECRET must be set for site-api too

r.Group(func(r chi.Router) {
    r.Use(jwtauth.Verifier(auth.TokenAuth))
    r.Use(jwtauth.Authenticator(auth.TokenAuth))

    r.Post("/auth/logout", handler.SiteLogout)  // or handle in Next.js only
    r.Get("/me", handler.GetMe(database))
    r.Get("/me/subscriptions", handler.GetSubscriptions(database))
    r.Post("/me/subscriptions/{channel_id}", handler.Subscribe(database))
    r.Delete("/me/subscriptions/{channel_id}", handler.Unsubscribe(database))
    r.Get("/me/bookmarks", handler.GetBookmarks(database))
    r.Post("/me/bookmarks/{episode_id}", handler.Bookmark(database))
    r.Delete("/me/bookmarks/{episode_id}", handler.Unbookmark(database))
    r.Put("/me/password", handler.ChangePassword(database))
})
```

**Critical:** `auth.Init()` must be called in `cmd/site-api/main.go` — currently it is NOT called there. This means `JWT_SECRET` environment variable must also be added to the site-api Docker service.

### Pattern 4: Site Session — Next.js HttpOnly Cookie (TypeScript)

**What:** Replication of `admin-app/src/lib/session.ts` for site-app.
**When to use:** site-app login/logout server actions

```typescript
// site-app/src/lib/session.ts
import 'server-only'
import { cookies } from 'next/headers'

export async function createSiteSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('site_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getSiteSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('site_token')?.value ?? null
}

export async function deleteSiteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('site_token')
}
```

### Pattern 5: Authenticated API Fetch — site-app Client Components

**What:** Client-side fetch that sends the cookie automatically.
**When to use:** SubscribeButton, BookmarkButton — any Client Component calling `/api/site/me/*`

```typescript
// site-app/src/lib/api.ts — add authFetch for authenticated endpoints
export function authFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`/api/site${path}`, {
    ...options,
    credentials: 'include',  // sends site_token cookie through nginx to site-api
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}
```

**Note:** nginx already proxies `/api/site/` to site-api and passes all headers. Cookies in browser requests will be forwarded automatically by nginx. site-api reads the JWT from `Authorization: Bearer` header OR from the cookie — jwtauth.Verifier checks both by default (Authorization header first, then cookie named in config).

**jwtauth cookie extraction:** The `jwtauth.Verifier` by default only extracts from `Authorization: Bearer` header and query param `jwt`. To extract from a cookie, you need a custom TokenFinder:

```go
// In site-api main.go protected group:
r.Use(jwtauth.Verify(auth.TokenAuth,
    jwtauth.TokenFromHeader,
    jwtauth.TokenFromCookie("site_token"),
))
```

This means the browser only needs to send the cookie — no custom Authorization header needed from the client. nginx passes cookies to site-api transparently.

### Pattern 6: Server Component Auth State — Reading Cookie Server-Side

**What:** Reading site_token in Server Components to determine logged-in state for conditional UI.
**When to use:** TopNavbar (SSR), homepage "My Channels" rail, subscriptions/bookmarks pages

```typescript
// In any Server Component (e.g., layout.tsx or TopNavbar if made async server component)
import { getSiteSession } from '@/lib/session'
import { jwtVerify } from 'jose'

export async function getCurrentUser() {
  const token = await getSiteSession()
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.user_id as string }
  } catch {
    return null  // expired or invalid token
  }
}
```

`jose` is already in admin-app — needs to be added to site-app (`npm install jose`).

**Alternative:** Instead of verifying JWT client-side, call `GET /me` server-side. If 401, user is not logged in. If 200, user is logged in. This avoids exposing JWT_SECRET to the Next.js process — but JWT_SECRET is already an env var in Docker Compose, so either approach works. Recommend JWT verification in site-app for one fewer network round-trip.

**TopNavbar must become a server component** (or accept a `user` prop from a parent server component) to show guest vs. logged-in state on SSR. Currently TopNavbar is a pure server component (no `'use client'`) — good. The dropdown interaction (avatar click → menu) will need a separate `'use client'` ProfileMenu component.

### Pattern 7: Subscribe/Bookmark Optimistic UI (Client Components)

**What:** Toggle button that fires POST/DELETE and updates local state optimistically.
**When to use:** SubscribeButton on channel page, BookmarkButton on episode/watch page

```typescript
// SubscribeButton.tsx — 'use client'
'use client'
import { useState } from 'react'
import { authFetch } from '@/lib/api'

export function SubscribeButton({ channelId, initialSubscribed }: {
  channelId: string
  initialSubscribed: boolean
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const method = subscribed ? 'DELETE' : 'POST'
    const res = await authFetch(`/me/subscriptions/${channelId}`, { method })
    if (res.ok || res.status === 409) {  // 409 = already subscribed (idempotent)
      setSubscribed(!subscribed)
    } else if (res.status === 401) {
      // Redirect to login with return URL
      window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`
    }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={subscribed ? 'btn-subscribed' : 'btn-subscribe'}>
      {subscribed ? 'عضو هستید' : 'عضویت'}
    </button>
  )
}
```

**Passing `initialSubscribed` to the component:** The channel page is a server component. It checks `getSiteSession()` → calls `GET /me/subscriptions` → checks if `channel_id` is in the list → passes as prop to `SubscribeButton`. If user is not logged in, `initialSubscribed` is `false`.

### Pattern 8: Data Models — Subscription and Bookmark

```go
// backend/internal/models/subscription.go
type Subscription struct {
    ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
    UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
    ChannelID bson.ObjectID `bson:"channel_id" json:"channel_id"`
    CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}

// backend/internal/models/bookmark.go
type Bookmark struct {
    ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
    UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
    EpisodeID bson.ObjectID `bson:"episode_id" json:"episode_id"`
    CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
```

**Required MongoDB indexes (add to `db.EnsureIndexes`):**
```go
// subscriptions: compound unique on (user_id, channel_id)
CollSubscriptions: compound unique index {user_id:1, channel_id:1}
// + index on user_id alone for fast GET /me/subscriptions
CollSubscriptions: {user_id:1}

// bookmarks: compound unique on (user_id, episode_id)
CollBookmarks: compound unique index {user_id:1, episode_id:1}
// + index on user_id alone for fast GET /me/bookmarks
CollBookmarks: {user_id:1}
```

Also add `CollSubscriptions = "subscriptions"` and `CollBookmarks = "bookmarks"` to the `db` constants.

### Pattern 9: Admin Users List Handler (Go)

```go
// backend/internal/handler/admin_users.go
func ListUsers(database *mongo.Database) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()
        opts := options.Find().
            SetSort(bson.D{{Key: "created_at", Value: -1}}).
            SetProjection(bson.D{
                {Key: "password_hash", Value: 0},  // never expose hash
            })
        cursor, err := database.Collection(db.CollUsers).Find(ctx, bson.D{}, opts)
        // ... same cursor.All pattern as other list handlers
    }
}
```

Register in admin-api main.go inside the protected group:
```go
r.Get("/users", handler.ListUsers(database))
```

### Anti-Patterns to Avoid

- **Do NOT expose `password_hash`:** Always project it out in all User queries. The `json:"-"` tag on the User model already prevents accidental JSON serialization, but projection in MongoDB queries is belt-and-suspenders.
- **Do NOT reuse `admin_token` cookie name for site users:** Use `site_token` to avoid collision. Admin-api and site-api are separate services; a user's site token must not authenticate admin routes.
- **Do NOT make TopNavbar a Client Component for auth state:** It is currently a server component. Keep it server-side — pass a `user` prop or call `getCurrentUser()` directly. Wrapping in `'use client'` would lose SSR auth state.
- **Do NOT call `auth.Init()` without adding `JWT_SECRET` to site-api's docker-compose environment:** site-api currently has no `JWT_SECRET` env var. This must be added to docker-compose.yml.
- **Do NOT use `window.location.href` for login redirect inside a server action:** Server actions use `redirect()` from next/navigation. Only client event handlers use window.location — and only as fallback for the bookmark/subscribe 401 case.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/verification | Custom HMAC implementation | `go-chi/jwtauth/v5` (already installed) | Already battle-tested in admin-api; TokenFromCookie added in same package |
| Password hashing | Custom hash function | `golang.org/x/crypto/bcrypt` (already installed) | bcrypt has adaptive cost, timing-safe comparison; already used in Login handler |
| Cookie management in Next.js | Manual Set-Cookie headers | `cookies()` from `next/headers` (already used) | Handles secure flags, SameSite, HttpOnly correctly; already proven in admin-app |
| Duplicate subscription prevention | Application-level check | MongoDB compound unique index | Race conditions possible with application check; unique index is atomic |
| JWT decode in Next.js middleware | Custom base64 decode | `jose` (already in admin-app) | Handles expiry, algorithm checking, clock skew automatically |

**Key insight:** Every hard problem in this phase (JWT, bcrypt, cookies, deduplication) is already solved in the codebase — Phase 4 is mostly wiring together existing patterns in new combinations.

---

## Common Pitfalls

### Pitfall 1: JWT_SECRET Missing from site-api Docker Service

**What goes wrong:** `auth.Init()` panics at startup because `JWT_SECRET` is not in site-api's environment block in docker-compose.yml.
**Why it happens:** Currently only admin-api has `JWT_SECRET` set. site-api has no auth yet.
**How to avoid:** Add `JWT_SECRET: "${JWT_SECRET}"` to the site-api service in docker-compose.yml when wiring up auth.Init() in site-api main.go.
**Warning signs:** site-api container crashes immediately on startup with "JWT_SECRET environment variable must be set".

### Pitfall 2: jwtauth.Verifier Does Not Read Cookies by Default

**What goes wrong:** Browser sends `site_token` cookie, but site-api returns 401 because jwtauth only checks `Authorization: Bearer` and `?jwt=` query param by default.
**Why it happens:** `jwtauth.Verifier(auth.TokenAuth)` uses default token finders. `jwtauth.TokenFromCookie` is not included by default.
**How to avoid:** Use `jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, jwtauth.TokenFromCookie("site_token"))` in the protected route group.
**Warning signs:** Authenticated endpoints return 401 even when the browser sends the cookie; works fine when Authorization header is set manually.

### Pitfall 3: TopNavbar Auth State Flash (Hydration Mismatch)

**What goes wrong:** TopNavbar renders as guest server-side, then React hydrates and tries to read login state from a client hook — causing a visible "Login" → "Avatar" flash.
**Why it happens:** Mixing server-rendered auth state with client-side auth state.
**How to avoid:** Keep TopNavbar as a server component that reads the cookie directly. Extract the interactive dropdown into a separate `'use client'` ProfileDropdown component that receives `user` as a prop. No client-side auth state reads.
**Warning signs:** Visible flash of login button on page load for logged-in users.

### Pitfall 4: Register Returning Too Much Information

**What goes wrong:** Register endpoint returns the new user object including any sensitive fields, or returns an error message that reveals whether an email is registered ("email already in use" — reveals enumeration).
**Why it happens:** Following CRUD patterns without thinking about auth security.
**How to avoid:** For duplicate email, return HTTP 409 Conflict with a generic message ("registration failed, please try a different email" in Persian). Return 201 Created with no body on success — the client immediately calls login.
**Warning signs:** A script can enumerate registered emails by checking for 409 vs 500.

### Pitfall 5: Return URL Injection via Login Redirect

**What goes wrong:** Guest taps subscribe, gets redirected to `/login?return=/evil-site.com`. After login, the app redirects to the external site.
**Why it happens:** Naive `redirect(returnUrl)` without validating the return URL is internal.
**How to avoid:** Validate the `return` param: only redirect if it starts with `/` (relative path) and does not start with `//` (protocol-relative URL). Sanitize in the login server action.
**Warning signs:** Any external URL in the `return` param causes a redirect out of the site after login.

### Pitfall 6: Subscription/Bookmark List Page Shows Stale Data

**What goes wrong:** User subscribes to a channel, navigates to `/subscriptions`, but it shows the old (unsubscribed) list because Next.js cached the server component.
**Why it happens:** Next.js 16 server component fetch is cached by default. The subscriptions page fetches `/me/subscriptions` which is a dynamic, user-specific endpoint.
**How to avoid:** Use `cache: 'no-store'` on the fetch in the subscriptions/bookmarks server component pages. Or use `revalidatePath` in the subscribe server action (if subscribe is implemented as a server action rather than client-side fetch).
**Warning signs:** Subscriptions page shows stale data after subscribe/unsubscribe actions.

---

## Code Examples

### Register Server Action (site-app)

```typescript
// site-app/src/app/actions/auth.ts
'use server'
import { redirect } from 'next/navigation'
import { createSiteSession, deleteSiteSession } from '@/lib/session'

const SITE_API_INTERNAL_URL = process.env.SITE_API_INTERNAL_URL ?? 'http://localhost:8081'

export async function register(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'ایمیل و رمز عبور الزامی است' }
  if (password.length < 8) return { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }

  let res: Response
  try {
    res = await fetch(`${SITE_API_INTERNAL_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: 'اتصال به سرور برقرار نشد. دوباره تلاش کنید.' }
  }

  if (res.status === 409) return { error: 'این ایمیل قبلاً ثبت شده است' }
  if (!res.ok) return { error: 'ثبت‌نام ناموفق بود. دوباره تلاش کنید.' }

  // Auto-login after successful registration
  const loginRes = await fetch(`${SITE_API_INTERNAL_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (loginRes.ok) {
    const data = await loginRes.json()
    await createSiteSession(data.token)
  }

  redirect('/')
}

export async function login(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const returnUrl = (formData.get('return') as string) ?? '/'

  // Validate returnUrl (prevent open redirect)
  const safeReturn = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/'

  if (!email || !password) return { error: 'ایمیل و رمز عبور الزامی است' }

  let res: Response
  try {
    res = await fetch(`${SITE_API_INTERNAL_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: 'اتصال به سرور برقرار نشد. دوباره تلاش کنید.' }
  }

  if (!res.ok) return { error: 'ایمیل یا رمز عبور اشتباه است' }

  const data = await res.json()
  await createSiteSession(data.token)
  redirect(safeReturn)
}

export async function logout() {
  await deleteSiteSession()
  redirect('/')
}
```

### Admin Users Page (admin-app)

```typescript
// admin-app/src/app/users/page.tsx (Server Component)
import { cookies } from 'next/headers'
import DataTable from '@/components/DataTable'

const ADMIN_API_INTERNAL_URL = process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

interface User {
  id: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchUsers(): Promise<User[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${ADMIN_API_INTERNAL_URL}/users`, {
    headers,
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function UsersPage() {
  const users = await fetchUsers()
  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'created_at', label: 'Registered', render: (v: string) => new Date(v).toLocaleDateString() },
  ]
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users ({users.length})</h1>
      <DataTable columns={columns} rows={users} />
    </div>
  )
}
```

### MongoDB Subscription Insert (idempotent)

```go
// POST /me/subscriptions/{channel_id}
func Subscribe(database *mongo.Database) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        _, claims, _ := jwtauth.FromContext(r.Context())
        userIDStr, _ := claims["user_id"].(string)
        userOID, _ := bson.ObjectIDFromHex(userIDStr)

        channelIDStr := chi.URLParam(r, "channel_id")
        channelOID, err := bson.ObjectIDFromHex(channelIDStr)
        if err != nil {
            http.Error(w, "invalid channel_id", http.StatusBadRequest)
            return
        }

        sub := models.Subscription{
            UserID:    userOID,
            ChannelID: channelOID,
            CreatedAt: time.Now(),
        }
        _, err = database.Collection(db.CollSubscriptions).InsertOne(r.Context(), sub)
        if mongo.IsDuplicateKeyError(err) {
            w.WriteHeader(http.StatusConflict)  // already subscribed — client treats as success
            return
        }
        if err != nil {
            http.Error(w, "failed to subscribe", http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusCreated)
    }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/headers` cookies() synchronous | `cookies()` is now async (returns Promise) | Next.js 15+ | Must `await cookies()` — already done correctly in admin-app session.ts |
| middleware.ts filename | proxy.ts with `export function proxy()` | Next.js 16 | Already correct in admin-app — site-app does not currently have middleware/proxy |
| jwtauth v4 `TokenFromCookie` | jwtauth v5 same API; verify with `jwtauth.Verify()` (not `jwtauth.Verifier()`) for custom token finders | jwtauth/v5 | Use `jwtauth.Verify(auth.TokenAuth, ...)` not `jwtauth.Verifier(auth.TokenAuth)` when adding cookie support |
| `primitive.ObjectID` | `bson.ObjectID` (mongo-driver v2) | v2.0.0 | Already handled correctly in all existing handlers — follow same pattern for new models |

**Deprecated/outdated:**
- `primitive.ObjectID`: Removed in mongo-driver v2; use `bson.ObjectID` — already correct in this project
- Next.js `middleware.ts` export: Renamed to `proxy.ts` with `export function proxy()` in Next.js 16 — already correct in admin-app

---

## Open Questions

1. **Does site-app need a proxy.ts for auth route protection?**
   - What we know: admin-app uses proxy.ts to redirect unauthenticated requests to /admin/login. site-app currently has no proxy.ts.
   - What's unclear: The subscriptions and bookmarks pages need to redirect guests to /login. But unlike admin, site pages are public by default — only /subscriptions, /bookmarks, /account need protection.
   - Recommendation: Add a proxy.ts to site-app that redirects to /login if `site_token` is missing when accessing `/subscriptions`, `/bookmarks`, or `/account`. Pages can also check server-side and redirect. Either works; proxy.ts is cleaner.

2. **How should the "My Channels" homepage rail fetch subscriptions?**
   - What we know: HomePage (page.tsx) is a Server Component doing parallel fetches. For logged-in users, it needs to fetch `/me/subscriptions` from site-api (using the site_token cookie).
   - What's unclear: The current `apiServerFetch` utility doesn't pass auth headers. A new `apiServerAuthFetch` utility that accepts a token string is needed.
   - Recommendation: Add `apiServerAuthFetch(path, token)` to `site-app/src/lib/api.ts`. Call it in HomePage after reading `getSiteSession()`. If no token, skip the "My Channels" rail.

3. **Should logout clear the cookie via a server action or via a site-api endpoint?**
   - What we know: admin-app logout is a server action that calls `deleteSiteSession()` only — no API call needed because JWTs are stateless.
   - What's unclear: No revocation list is needed for v1.
   - Recommendation: Same pattern as admin — server action deletes cookie, no API call needed. JWT expiry (7 days) is acceptable for v1.

---

## Sources

### Primary (HIGH confidence)

- `/Users/hadi/Documents/Self/kidtube/backend/internal/auth/jwt.go` — Existing JWT setup; IssueToken, TokenAuth singleton
- `/Users/hadi/Documents/Self/kidtube/backend/internal/handler/auth.go` — Login handler pattern (bcrypt + JWT + JSON response)
- `/Users/hadi/Documents/Self/kidtube/backend/internal/models/user.go` — Existing User struct; password_hash json:"-" already correct
- `/Users/hadi/Documents/Self/kidtube/backend/internal/db/mongo.go` — Existing indexes; users unique email index already created
- `/Users/hadi/Documents/Self/kidtube/admin-app/src/lib/session.ts` — HttpOnly cookie pattern (createSession/getSession/deleteSession)
- `/Users/hadi/Documents/Self/kidtube/admin-app/src/app/actions/auth.ts` — Login server action pattern
- `/Users/hadi/Documents/Self/kidtube/admin-app/src/proxy.ts` — Next.js 16 proxy.ts middleware pattern
- `/Users/hadi/Documents/Self/kidtube/backend/cmd/site-api/main.go` — Current site-api router (no auth.Init, no JWT_SECRET)
- `/Users/hadi/Documents/Self/kidtube/backend/cmd/admin-api/main.go` — Protected route group with jwtauth middleware
- `/Users/hadi/Documents/Self/kidtube/docker-compose.yml` — Service environment variables; site-api lacks JWT_SECRET
- `/Users/hadi/Documents/Self/kidtube/backend/go.mod` — Confirmed library versions

### Secondary (MEDIUM confidence)

- go-chi/jwtauth/v5 documentation: `jwtauth.Verify()` with custom token finders including `jwtauth.TokenFromCookie` — verified against library version in go.mod (v5.4.0)
- Next.js 16 cookies() async behavior — verified against admin-app/src/lib/session.ts which already uses `await cookies()`

### Tertiary (LOW confidence)

- None — all key claims verified against actual project source files

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and used in the project
- Architecture patterns: HIGH — directly derived from existing admin-api/admin-app patterns
- Pitfalls: HIGH — identified from actual code inspection (JWT_SECRET missing from site-api, jwtauth cookie behavior)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack; jwtauth/v5 and Next.js 16 APIs unlikely to change)
