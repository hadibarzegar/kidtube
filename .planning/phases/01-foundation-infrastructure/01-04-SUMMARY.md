---
phase: 01-foundation-infrastructure
plan: 04
subsystem: ui
tags: [nextjs, react, typescript, tailwindcss, rtl, persian, vazirmatn, docker]

# Dependency graph
requires: []
provides:
  - site-app Next.js 16 application with RTL layout, Vazirmatn font, standalone Docker build
  - admin-app Next.js 16 application with RTL layout, Vazirmatn font, basePath /admin, standalone Docker build
  - Both apps with lang="fa" dir="rtl" on html root element
  - Tailwind v4 configured with Vazirmatn as default sans font via @theme CSS
affects:
  - phase-02 (feature API routes will need to match these app structures)
  - phase-03 (UI components will build on this RTL/font foundation)

# Tech tracking
tech-stack:
  added:
    - next@16.1.6 (Next.js 16 with Turbopack)
    - react@19
    - tailwindcss@4 (with @tailwindcss/postcss, no tailwind.config.ts needed)
    - vazirmatn (Persian font npm package)
    - next/font/local (for zero-layout-shift local font loading)
  patterns:
    - Tailwind v4 font configuration via @theme CSS block instead of tailwind.config.ts
    - next/font/local loading from node_modules for Docker-compatible offline font serving
    - RTL-first layout using logical properties (ms-*, me-*, ps-*, pe-*)
    - Multi-stage Docker builds with Next.js standalone output

key-files:
  created:
    - site-app/src/lib/fonts.ts
    - site-app/src/app/layout.tsx
    - site-app/src/app/page.tsx
    - site-app/src/app/globals.css
    - site-app/next.config.ts
    - site-app/Dockerfile
    - admin-app/src/lib/fonts.ts
    - admin-app/src/app/layout.tsx
    - admin-app/src/app/page.tsx
    - admin-app/src/app/globals.css
    - admin-app/next.config.ts
    - admin-app/Dockerfile
  modified: []

key-decisions:
  - "Used Tailwind v4 @theme CSS block instead of tailwind.config.ts for font configuration (create-next-app scaffolds v4 by default)"
  - "next/font/local loads Vazirmatn from node_modules path — preferred over Google Fonts for offline/Docker builds"
  - "admin-app basePath set to /admin to match nginx routing (all admin routes prefixed)"
  - "output: standalone in both next.config.ts files for self-contained Docker deployments"

patterns-established:
  - "RTL Layout Pattern: html element always has lang='fa' dir='rtl' className={vazirmatn.variable}"
  - "Font Pattern: next/font/local with 4 weights (300/400/500/700), display: swap, CSS variable --font-vazirmatn"
  - "Tailwind v4 Pattern: @theme block in globals.css sets --font-sans using the CSS variable from next/font"
  - "Docker Pattern: multi-stage build (deps, builder, runner) with standalone output and non-root nextjs user"

requirements-completed: [RTL-01, RTL-02, RTL-04]

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 4: Next.js RTL Frontend Apps Summary

**Two Next.js 16 apps (site-app and admin-app) scaffolded with RTL Persian layout, Vazirmatn font via next/font/local (4 weights), Tailwind v4 @theme configuration, and multi-stage Docker builds with standalone output**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-28T20:59:37Z
- **Completed:** 2026-03-01T00:05:00Z
- **Tasks:** 2
- **Files modified:** 12 (6 per app)

## Accomplishments

- Scaffolded site-app and admin-app with Next.js 16, TypeScript, Tailwind v4, ESLint
- Configured RTL root layouts with `lang="fa" dir="rtl"` on html elements in both apps (satisfies RTL-01)
- Loaded Vazirmatn Persian font via `next/font/local` from node_modules with weights 300, 400, 500, 700 and `display: swap` (satisfies RTL-04, zero layout shift)
- Configured Tailwind v4 font via `@theme { --font-sans: var(--font-vazirmatn) }` in globals.css (satisfies RTL-02)
- Set `output: standalone` in both next.config.ts for Docker-compatible self-contained builds
- Set `basePath: '/admin'` in admin-app for correct nginx routing
- Created multi-stage Dockerfiles with non-root nextjs user and health-ready structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold site-app with Next.js 16, RTL layout, Vazirmatn font, and Tailwind CSS** - `76b34ce` (feat)
2. **Task 2: Scaffold admin-app with Next.js 16, RTL layout, and Vazirmatn font** - `0b9a5b0` (feat, included in previous plan commit)

## Files Created/Modified

- `site-app/src/lib/fonts.ts` - Vazirmatn font config via next/font/local with 4 weights and CSS variable
- `site-app/src/app/layout.tsx` - Root layout with RTL html element, Vazirmatn variable, header placeholder
- `site-app/src/app/page.tsx` - Persian-language homepage placeholder
- `site-app/src/app/globals.css` - Tailwind v4 @theme with Vazirmatn as default sans font
- `site-app/next.config.ts` - output: standalone for Docker
- `site-app/Dockerfile` - Multi-stage Docker build with standalone output
- `admin-app/src/lib/fonts.ts` - Identical Vazirmatn config to site-app
- `admin-app/src/app/layout.tsx` - Admin root layout with RTL, gray header, Persian title
- `admin-app/src/app/page.tsx` - Persian admin dashboard placeholder
- `admin-app/src/app/globals.css` - Same Tailwind v4 @theme as site-app
- `admin-app/next.config.ts` - output: standalone, basePath: /admin
- `admin-app/Dockerfile` - Multi-stage Docker build exposing port 3001

## Decisions Made

- **Tailwind v4 adaptation:** create-next-app scaffolds Tailwind v4 by default (not v3 as the plan assumed). In v4, font configuration uses `@theme` CSS blocks instead of `tailwind.config.ts`. The plan's `tailwind.config.ts` approach was adapted to v4's CSS-first configuration — same outcome (Vazirmatn as default sans), different mechanism.
- **next/font/local from node_modules:** Preferred over Google Fonts for Docker build compatibility — fonts are bundled in the npm package and referenced by relative path from the app source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/Adaptation] Tailwind v4 CSS-based font configuration instead of tailwind.config.ts**
- **Found during:** Task 1 (site-app scaffold)
- **Issue:** Plan assumed Tailwind v3 with tailwind.config.ts. create-next-app@latest installs Tailwind v4 which uses CSS `@import "tailwindcss"` and `@theme` blocks, not a JS config file. Plan's tailwind.config.ts would be ignored in v4.
- **Fix:** Configured Vazirmatn as default sans font via `@theme { --font-sans: var(--font-vazirmatn) }` in globals.css — functionally identical outcome.
- **Files modified:** site-app/src/app/globals.css, admin-app/src/app/globals.css
- **Verification:** Both apps build successfully, font is applied via CSS variable chain
- **Committed in:** 76b34ce (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (framework version adaptation)
**Impact on plan:** Tailwind v4 adaptation achieves identical RTL/font outcome via CSS-first config. No scope creep, all requirements satisfied.

## Issues Encountered

- None — both apps built successfully on first attempt after configuration

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both frontend apps build without errors and have RTL Persian layout from day one
- Vazirmatn font loaded with zero layout shift via next/font/local
- Docker standalone builds ready for Docker Compose integration
- Phase 2 can use `site-app/` and `admin-app/` as the frontend base for API routes and feature pages
- Phase 3 UI components will inherit RTL/font setup automatically from root layouts

## Self-Check: PASSED

All created files verified present on disk. Both commit hashes (76b34ce, 0b9a5b0) confirmed in git log.

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-03-01*
