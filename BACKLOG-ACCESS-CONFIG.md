# Backlog: Access-Config Enforcement

## Goal

Enforce the `group_access` system so that page access is controlled by the database-driven access config, not by scattered `hasRole()` checks in individual pages.

## Current State

### What exists
- `lib/access.ts` — `loadAccessConfig()`, `hasPageAccess(role, path)`, `clearAccessConfigCache()`
- `supabase` table `group_access` with pages JSONB per role group
- `/api/auth/access` — returns allowed pages for the current user (used by sidebar)
- `/api/admin/access-config` — CRUD for group_access (admin UI at `/admin/access-config`)
- `components/Sidebar.tsx` — fetches `allowedPages` and filters nav items
- `app/403/page.tsx` — static 403 page exists but is **never triggered**

### What's missing
1. **No middleware or layout-level enforcement** — pages check `hasRole()` independently, and some don't check at all
2. **`hasPageAccess()` is never called** in page components
3. **No redirect to `/403`** — denied access goes to `/login` instead
4. **Client component pages** (`admin/users`, `admin/data-management`, `student/evaluations`) have no server-side access check
5. **`admin/reports/*` pages** only check `session?.user`, not ADMIN role
6. **Sidebar filtering is cosmetic** — doesn't prevent URL-based navigation

## Plan

### Part A: Navigation Hiding (Sidebar)

**Status: Mostly done.** The sidebar already calls `/api/auth/access` and filters `ALL_NAV_ITEMS` against `allowedPages`.

Needs:
- [ ] Ensure all page routes are registered in the `group_access` seed data + admin page catalog
- [ ] Add `/admin/reports/*` child paths to the scanned page catalog in `/api/admin/access-config` so admins can toggle them individually
- [ ] Add new evaluation ETL page paths to `group_access` when they're built

### Part B: Server-Side Enforcement (403 Redirect)

Create a **middleware** or **layout-level guard** that enforces `hasPageAccess()` on every request:

**Option 1 — `middleware.ts` (Recommended)**
```
File: middleware.ts (project root)

Logic:
1. Extract session from NextAuth
2. Get current pathname
3. Call hasPageAccess(role, pathname)
4. If denied → redirect to /403
5. Allow auth pages (/, /login, /activate, /forgot-password, /change-password) through
```

**Option 2 — Per-role layouts**
```
Create:
  app/admin/layout.tsx
  app/dean/layout.tsx
  app/faculty/layout.tsx
  app/student/layout.tsx

Each calls hasPageAccess() and redirects to /403 on failure.
```

**Recommendation:** Option 1 (middleware) is simpler and covers all pages, including client components that currently have no checks.

### Implementation Steps

1. **Create `middleware.ts`**
   - Use NextAuth's `getToken()` or `auth()` to read the session
   - Whitelist: `/login`, `/activate`, `/forgot-password`, `/change-password`, `/setup-password`, `/403`, `/_next/*`, `/api/auth/*`
   - For all other pages: call `hasPageAccess(role, pathname)`
   - If denied → `NextResponse.redirect(new URL('/403', request.url))`
   - If allowed → `NextResponse.next()`

2. **Update page-level checks**
   - Remove existing `hasRole()` + `redirect("/login")` from server components
   - (Optional) Keep them as defense-in-depth — middleware is the primary gate

3. **Add missing pages to `group_access` seed data**
   - Audit all page routes and ensure they're in the DEFAULT_CONFIG in `lib/access.ts`
   - Add any missing evaluation/report page paths

4. **Client component pages**
   - `/admin/users` — after middleware, no change needed
   - `/student/evaluations` — after middleware, no change needed

### Files to Modify

| File | Change |
|------|--------|
| `middleware.ts` (new) | Enforce `hasPageAccess()` on all page requests |
| `lib/access.ts` | Update `DEFAULT_CONFIG` with all current page paths |
| `supabase-schema.sql` | Update `group_access` seed data with any missing paths |
| Individual server pages | Remove redundant `hasRole()` + `redirect("/login")` (optional cleanup) |
| `app/api/admin/access-config/route.ts` | Add missing paths to page catalog |

### Risks

- **Middleware + NextAuth compatibility**: `auth()` in middleware has some constraints. Need to verify `getToken()` from `next-auth/jwt` works.
- **API routes excluded**: Middleware should NOT block API routes — their own auth logic handles it
- **Middleware matcher**: Use `config.matcher` in middleware to exclude api, static files, and auth pages
- **Performance**: `hasPageAccess()` has a 60s cache, so DB lookups aren't per-request

### Dependencies

- Existing `lib/access.ts` `hasPageAccess()` function — already works
- Existing NextAuth session — already set up
- Existing `app/403/page.tsx` — already exists

### Out of Scope

- API-level access config enforcement (API routes check roles internally)
- Dynamically hiding UI elements beyond sidebar navigation
- Per-user (vs per-role) access configuration
