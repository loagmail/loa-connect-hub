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

## 2. `GET /api/data/evaluation-mappings` Returns 500

### Symptom

Calling `GET /api/data/evaluation-mappings?type=faculty` (or `type=student`) returns a 500 error.

### Root Cause

The query uses Supabase embedded join syntax:

```typescript
.select(`
  id,
  faculty:facultyId (id, name, email),
  subject:subjectId (id, code, name),
  section:sectionId (id, name, program)
`)
```

PostgREST requires foreign key relationships to be recognized for the `foreignTable:foreignColumn()` join syntax. Despite the FK constraints being defined in the SQL schema (`REFERENCES users(id) ON DELETE CASCADE`), PostgREST may not have picked them up. This can happen when:
- The schema cache hasn't been refreshed after migration
- Quoted column names interfere with FK detection
- The FK exists in the database but PostgREST's schema cache is stale

### Possible Fixes

- **Refresh schema cache**: Run `NOTIFY pgrst, 'reload schema'` in Supabase SQL Editor or go to API Settings → Schema Cache → Refresh
- **Drop quoted column names**: Unquote `"facultyId"` → `facultyId` in the CREATE TABLE (requires migration)
- **Rewrite without joins**: Use separate queries and manual resolution (e.g., fetch mappings first, then batch-lookup related rows)

### Notes

- `type=subjects` and `type=sections` work fine (they're simple table selects with no joins)
- The same join pattern was previously used in the "ViewMappings" component on `/admin/etl-hub` (now replaced by separate `/admin/data/*` pages)
- No urgency since the dedicated `/admin/data/faculty-mappings` and `/admin/data/student-enrollments` pages use their own working queries

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

---

## 6. Student CSV Upload Flow

### Goal

Build a student CSV bulk import flow that validates against existing faculty-subject-section mappings (from faculty upload). Students are enrolled into sections via `student_enrollments` for the evaluation system. No auto-creation of sections or subjects — they must pre-exist.

### Design Doc

`STUDENT-CSV-UPLOAD.md`

### CSV Format

```
student email, name, subject code, section
alice.student@lyceumalabang.edu.ph, Alice Student, ELEC-323, BSIT-32A1
```

### Per-Row Validation

1. Parse & validate columns (email domain, required fields)
2. Create user if not exists (STUDENT role)
3. Validate section exists in DB → fail row if not
4. Validate subject exists in DB → fail row if not
5. Validate `faculty_subject` mapping exists for (subject, section) → fail row if not
6. Create `student_enrollment` (additive, skip if exists)

### Key Behaviors

- **No auto-create** for sections, subjects, or faculty-subject mappings
- **Two downloadable CSVs** after upload: successes + failures (with remarks column)
- **Blocking progress modal** during upload
- No new dependencies (CSVs generated as strings, blobs client-side)

### Files

| File | Status |
|------|--------|
| `lib/services/studentImport.ts` | ✅ Complete — `parseStudentCsv()`, `importStudents()`, `getStudentCsvTemplate()` |
| `app/api/import/students/route.ts` | ✅ Complete — rewritten to use `importStudents()`; accepts JSON or multipart |
| `components/bulk-import/BulkStudentImport.tsx` | ✅ Complete — file selection, editable preview, blocking modal, results + download |
| `lib/repositories/supabase/student-enrollment.ts` | ✅ Complete — `addEnrollments()` additive batch insert with dedup |
| `lib/types/evaluation.ts` | ✅ Complete — `addEnrollments` added to `IStudentEnrollmentRepository` interface |
| `lib/__tests__/studentImport.test.ts` | ❌ Not started — unit tests for service missing |

### Notes

- UI lives in `app/admin/etl-hub/page.tsx` (Student Import tab) — faculty and dean upload pages were left untouched
- No tests yet for the service layer
- Design doc: `STUDENT-CSV-UPLOAD.md`
