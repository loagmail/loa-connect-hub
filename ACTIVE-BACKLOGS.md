# Active Backlogs

> Working file for tracking issues, bugs, and improvements across the project.
> Data may be stale — verify before acting.

---

## 1. Access-Config Enforcement

### Goal

Enforce the `group_access` system so that page access is controlled by the database-driven access config, not by scattered `hasRole()` checks in individual pages.

### Current State

#### What exists
- `lib/access.ts` — `loadAccessConfig()`, `hasPageAccess(role, path)`, `clearAccessConfigCache()`
- `supabase` table `group_access` with pages JSONB per role group
- `/api/auth/access` — returns allowed pages for the current user (used by sidebar)
- `/api/admin/access-config` — CRUD for group_access (admin UI at `/admin/access-config`)
- `components/Sidebar.tsx` — fetches `allowedPages` and filters nav items; has collapsible Data Management + Evaluations groups
- `app/403/page.tsx` — static 403 page exists but is **never triggered**

#### What's missing
1. **No middleware or layout-level enforcement** — pages check `hasRole()` independently, and some don't check at all
2. **`hasPageAccess()` is never called** in page components
3. **No redirect to `/403`** — denied access goes to `/login` instead
4. **DB `group_access` table overrides `DEFAULT_CONFIG`** — new `/admin/data/*` paths added to `DEFAULT_CONFIG` in code but may not be in the DB table, causing sidebar links to not appear
5. **`admin/reports/*` pages** only check `session?.user`, not ADMIN role
6. **Sidebar filtering is cosmetic** — doesn't prevent URL-based navigation

#### Stale items (removed from backlog)
- `/admin/users` client component — now moved to `/admin/data/users` (server component)
- `admin/data-management` — no longer an active path

### Plan

#### Part A: Navigation Hiding (Sidebar)

**Status: Mostly done.** The sidebar already calls `/api/auth/access` and filters `ALL_NAV_ITEMS` against `allowedPages`.

Needs:
- [ ] Ensure all page routes are registered in the `group_access` seed data + admin page catalog
- [ ] Add `/admin/reports/*` child paths to the scanned page catalog in `/api/admin/access-config` so admins can toggle them individually
- [ ] Sync `/admin/data/*` and other new paths into the DB `group_access` table

#### Part B: Server-Side Enforcement (403 Redirect)

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

#### Implementation Steps

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
   - `/admin/data/users` — after middleware, no change needed
   - `/student/evaluations` — after middleware, no change needed

#### Files to Modify

| File | Change |
|------|--------|
| `middleware.ts` (new) | Enforce `hasPageAccess()` on all page requests |
| `lib/access.ts` | Update `DEFAULT_CONFIG` with all current page paths |
| `supabase-schema.sql` | Update `group_access` seed data with any missing paths |
| Individual server pages | Remove redundant `hasRole()` + `redirect("/login")` (optional cleanup) |
| `app/api/admin/access-config/route.ts` | Add missing paths to page catalog |

#### Risks

- **Middleware + NextAuth compatibility**: `auth()` in middleware has some constraints. Need to verify `getToken()` from `next-auth/jwt` works.
- **API routes excluded**: Middleware should NOT block API routes — their own auth logic handles it
- **Middleware matcher**: Use `config.matcher` in middleware to exclude api, static files, and auth pages
- **Performance**: `hasPageAccess()` has a 60s cache, so DB lookups aren't per-request

#### Dependencies

- Existing `lib/access.ts` `hasPageAccess()` function — already works
- Existing NextAuth session — already set up
- Existing `app/403/page.tsx` — already exists

#### Out of Scope

- API-level access config enforcement (API routes check roles internally)
- Dynamically hiding UI elements beyond sidebar navigation
- Per-user (vs per-role) access configuration

---

## 3. DB `group_access` Overrides `DEFAULT_CONFIG`

### Symptom

New `/admin/data/*` sidebar links don't appear despite being added to `DEFAULT_CONFIG` in `lib/access.ts`.

### Root Cause

The `loadAccessConfig()` function in `lib/access.ts` loads from the DB `group_access` table first, and that table's rows **completely override** (not merge with) the `DEFAULT_CONFIG`. If the DB rows don't include the new paths, they won't appear regardless of the code config.

### Possible Fix

- Update the `group_access` rows in the DB (via `/admin/access-config` UI or SQL seed data) to include all new `/admin/data/*` paths
- Or change `loadAccessConfig()` to merge DB config with DEFAULT_CONFIG instead of replacing

---

## 4. Pre-existing TS Errors

### `lib/__tests__/import-preview.test.ts`

- `NextRequest` type mismatch — test file was written for an older Next.js version
- Unrelated to evaluation work
- Low priority

---

## 5. User-Level Permission Overrides

### Goal

Add granular per-user permission overrides on top of the existing RBAC (`group_access`). RBAC stays as the backbone (page-level routing via `proxy.ts`); the new layer controls specific actions within a page (API + UI).

### Plan

**5 phases, 5 PRs:**

| Phase | Scope | Key Files |
|-------|-------|-----------|
| **0: Schema + Types** | `permissions JSONB` column on `users`; TypeScript types | `supabase-schema.sql`, `lib/types/permissions.ts`, `lib/types/repository.ts` |
| **1: Resolution Engine** | `parsePermission()`, `hasPermission()`, `pageCapabilities()`; JWT embedding | `lib/utils/permissions.ts`, `lib/auth.ts`, `lib/repositories/supabase/user.ts` |
| **2: UI Components** | `<AccessDeniedCard />` inline card | `components/AccessDeniedCard.tsx` |
| **3: Pilot — Departments** | API guards + `pageCapabilities` compose | `app/api/admin/departments/route.ts`, `app/admin/data/departments/page.tsx` |
| **4: Pilot — ETL Hub** | Tab hides via `pageCapabilities` | `app/admin/etl-hub/page.tsx` |
| **5: Admin Editor** | User search + checkbox grid for grants/denies | `app/admin/access-config/permissions/page.tsx` |

### Permission Format

URL-based: `<resource-path>:<action>` (e.g. `/admin/data/departments:create`)

| Resource | Actions |
|----------|---------|
| `/admin/data/departments` | `create`, `update`, `delete`, `read-all`, `read-only` |
| `/admin/etl-hub` | `import-faculty`, `import-student`, `download-template` |
| `/admin/users` | `create`, `update`, `delete`, `read-all`, `read-only`, `import`, `restore` |
| `/admin/appointments` | `create`, `update`, `delete`, `read-all`, `read-only`, `cancel`, `complete` |
| `/admin/evaluations` | `create-period`, `edit-period`, `delete-period`, `manage-rubric`, `view-results`, `compute-results`, `export-results` |
| `/admin/reports` | `view`, `export` |
| `/admin/access-config/permissions` | `view`, `edit` |

### Key Types

```ts
interface UserPermissions { grants: string[]; denies: string[] }
type EffectivePermissions = string[]
interface PageCapabilities {
  readScope: "all" | "own" | "none"
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}
```

### Resolution

```
effective = role_base (implicit via group_access)
if user.permissions is object:
  effective += grants; effective -= denies
embedded as effectivePermissions: string[] on session

pageCapabilities(resource) → readScope cascade:
  has(:delete|:update|:create|:read-all) → "all"
  has(:read-only)                         → "own"
  else                                    → "none"
```

### UI Pattern

```tsx
const caps = pageCapabilities(perms, "/admin/data/departments")
{caps.readScope === "all"  && <AllDataTable />}
{caps.readScope === "own"  && <OwnDataTable />}
{caps.readScope === "none" && <AccessDeniedCard />}
{caps.canCreate && <CreateForm />}
{caps.canUpdate && <EditActions />}
{caps.canDelete && <DeleteActions />}
```

### Admin Editor UX

Search user → checkbox grid per resource with 3 states:
- ✓ checked → in `grants`
- ✗ unchecked → in `denies`
- · dimmed → omitted (role default applies)

### Out of Scope

- `role_capabilities` table — role defaults stay implicit in `group_access`
- Wildcard matching — `hasPermission` stays O(n) includes
- Migration for existing users — `NULL` means role default
- SSO sync — permissions set manually via admin editor


