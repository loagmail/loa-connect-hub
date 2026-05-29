# Feature Plan — e-Consultation

## Priority Order & Dependencies

```
P1: Line Graph for Frequency    [independent]
P2: Storage Threshold Indicator  [independent]
P3: Soft-Delete Mechanism        [independent]
P4: Data Dump — Consultations    [independent of P3 — hard-delete]
P5: Data Dump — Students         [independent of P3 — hard-delete]
P6: Year Level for Students      [independent]
P7: Batch Promotion (Deans)      [depends on P6 + P8]
P8: Course↔Department Mapping    [independent — lowest priority]
```

---

## P1 — Line Graph for Consultation Frequency

### What
Replace the bar charts in `FrequencyView.tsx` (`DepartmentFrequencyChart` & `DepartmentYearlyChart`) with SVG line graphs.

### Implementation
- Keep pure SVG (no external library)
- Replace `<rect>` bars with `<polyline>` connecting points + `<circle>` markers
- **Monthly chart**: X-axis = months in chronological order, Y-axis = count
- **Yearly chart**: X-axis = years, Y-axis = count
- Keep dashed average line, tooltip/value labels at each point
- Keep all surrounding UI: granularity toggle, summary cards, per-faculty tables, faculty cards

### Files Changed
| File | Change |
|------|--------|
| `components/reports/FrequencyView.tsx` | Rewrite `DepartmentFrequencyChart` and `DepartmentYearlyChart` |

### Effort
~150 lines changed in a single file.

---

## P2 — Storage Threshold Indicator

### What
Show Supabase free-tier database usage on the admin dashboard (current usage / 500 MB limit).

### Implementation
- **Primary**: Query `pg_database_size(current_database())` via a raw SQL query on the Supabase client (service role has access). Convert bytes to MB.
- **Fallback**: Sum `fileSize` from `appointment_files` + estimate row overhead from `appointments`, `users`, etc. — gives a lower-bound approximation.
- Display as a progress bar card on `/admin` page:
  - Green <60%, Amber 60–85%, Red >85%
  - Text: "Database Storage: 142 MB / 500 MB (28%)"
  - Small note: "Free tier limit is 500 MB"

### Files Changed
| File | Change |
|------|--------|
| `lib/repositories/interfaces.ts` | Add `getDatabaseSize()` method to a new `IAdminRepository` interface (or add to existing) |
| `lib/repositories/supabase.ts` | Implement `getDatabaseSize()` — raw SQL via `supabase.rpc()` or `supabase.from('_rpc').select()` |
| `lib/repositories/factory.ts` | Export new repository |
| `app/admin/page.tsx` | Fetch `getDatabaseSize()` alongside users/audit logs; pass to client |
| `app/admin/page.tsx` | Add a server-side storage card in the metrics row |

**Alternative**: Keep it simpler — a single server component that runs the query and renders the card, no need for a full repository method.

### Effort
~50 lines across 3–4 files.

---

## P3 — Soft-Delete Mechanism

### What
Allow admin to "delete" users without removing their records. Soft-deleted users:
- Cannot log in (like `isDisabled`)
- Existing appointments remain intact (FKs with `ON DELETE SET NULL` or keep the ID)
- Visible only on a new Admin UI page

### Implementation

#### A. Database
Add `deletedAt` column to `users`:
```sql
ALTER TABLE users ADD COLUMN "deletedAt" TIMESTAMPTZ;
```

#### B. Repository
- `IUserRepository`: Add `softDelete(id)`, `listDeleted()`, `restore(id)`, `permanentDelete(id)` methods
- Modify `listAll()` to exclude soft-deleted by default (add `includeDeleted?: boolean` param)
- Modify `findByEmail()` to include soft-deleted (so you can't re-register the same email)

#### C. API
Add admin API routes:
- `POST /api/admin/users/[id]/soft-delete`
- `POST /api/admin/users/[id]/restore`
- `DELETE /api/admin/users/[id]` (permanent, only possible if already soft-deleted)
- `GET /api/admin/users/deleted`

#### D. Admin UI
New page: `/admin/users/deleted` (or a tab on the existing Manage Users page).
- Table: Name, Email, Role, Deleted At, Actions (Restore, Permanent Delete)
- Permanent delete shows a confirmation modal + requires typing "DELETE"

#### E. Sidebar / Access
- Add `/admin/users/deleted` to nav items, access config, sidebar
- Only visible/accessible to ADMIN role

### Files Changed
| File | Change |
|------|--------|
| `supabase-schema.sql` | Add migration for `deletedAt` column |
| `lib/repositories/interfaces.ts` | Add soft-delete methods to `IUserRepository` |
| `lib/repositories/supabase.ts` | Implement soft-delete methods; update `listAll()`, `findByEmail()` |
| `lib/controllers/admin-users.ts` (new) | Wrap repository calls for soft-delete/restore/permanent-delete |
| `app/api/admin/users/[id]/soft-delete/route.ts` (new) | API route |
| `app/api/admin/users/[id]/restore/route.ts` (new) | API route |
| `app/api/admin/users/[id]/route.ts` | Modify existing DELETE to support permanent delete |
| `app/api/admin/users/deleted/route.ts` (new) | List soft-deleted users |
| `app/admin/users/deleted/page.tsx` (new) | Admin UI page |
| `app/admin/users/page.tsx` | Possibly add a "Deleted Users" link/count |
| `lib/access.ts` | Add `/admin/users/deleted` to routes |
| `components/Sidebar.tsx` | Add nav link for ADMIN |
| `supabase-schema.sql` (seed data migration) | Update `group_access` insert for ADMIN |

### Effort
~300 lines across multiple files.

---

## P4 — Data Dump: Consultation Records

### What
Admin-only feature: download all consultation data as CSV/JSON, then permanently delete consultation records.

### UI Placement
A new **Data Management** section on the admin dashboard (or a new page `/admin/data-management`).

### Flow
1. Admin clicks "Export & Clear Consultation Records"
2. Confirmation modal: "This will download all consultation data and permanently delete it. This cannot be undone. Type CONFIRM to proceed."
3. Backend:
   a. Query all consultation data (appointments + files + attendees + time slots)
   b. Generate a downloadable JSON/CSV file
   c. Hard-delete all records from: `appointment_files`, `appointment_attendees`, `appointment_time_slots`, `appointments`
   d. Log to audit trail
4. File downloads automatically, then page refreshes showing 0 consultations

### What's excluded
- Faculty/Dean/Admin/Student user records
- Availability rules
- Audit logs
- Internal meetings (if any)

### Files Changed
| File | Change |
|------|--------|
| `lib/repositories/interfaces.ts` | Add `exportAndClearConsultations()` method to a new `IAdminRepository` |
| `lib/repositories/supabase.ts` | Implement — export query + batch delete in a transaction |
| `lib/controllers/admin-data.ts` (new) | Controller wrapping the repository call |
| `app/api/admin/data/export-consultations/route.ts` (new) | API route |
| `app/admin/data-management/page.tsx` (new) | UI page with the button + confirmation modal |
| `lib/access.ts` | Add `/admin/data-management` |
| `components/Sidebar.tsx` | Add nav link |
| `supabase-schema.sql` (`group_access` seed) | Add `/admin/data-management` to ADMIN pages |

### Effort
~200 lines.

---

## P5 — Data Dump: Student Records

### What
Admin-only feature: export and delete student user records (users with STUDENT role).

### Important Constraints
- Only delete students who have **no remaining consultation records** (or orphan the appointments with `studentId = NULL` — the column already allows NULL per migration 6)
- Actually, `appointments."studentId"` already has `ALTER COLUMN "studentId" DROP NOT NULL` — so we can SET NULL on their appointments before deleting the student user
- Cascade behavior: `appointment_attendees."userId"` has `ON DELETE CASCADE` — deleting a user would delete their attendee records. We need to decide: nullify or cascade?

### Implementation Options
**Option A (Recommended)**: Before deleting a student:
1. Find all their appointments
2. SET `studentId = NULL` on those appointments (orphan them — records remain, student is unknown)
3. Remove their `appointment_attendees` entries (or set those userIds to NULL too)
4. Hard-delete the user record
5. Keep all faculty/dean/admin records intact

**Option B**: Skip students who still have appointments (show count in UI).

### Files Changed
| File | Change |
|------|--------|
| `lib/repositories/interfaces.ts` | Add `exportAndDeleteStudents()` method |
| `lib/repositories/supabase.ts` | Implement — list students, nullify FK references, delete users |
| `lib/controllers/admin-data.ts` | Add controller |
| `app/api/admin/data/delete-students/route.ts` (new) | API route |
| `app/admin/data-management/page.tsx` | Add second section with separate button |
| (access/sidebar already done in P4) | — |

### Effort
~150 lines.

---

## P6 — Year Level for Students

### What
Add `yearLevel` field to student records. Range: 1–5.

### Implementation

#### A. Database
```sql
ALTER TABLE users ADD COLUMN "yearLevel" INTEGER CHECK ("yearLevel" BETWEEN 1 AND 5);
```

#### B. TypeScript
- Add `yearLevel` to `UserData` interface in `lib/repositories/interfaces.ts`
- Add `yearLevel` to the `ImportResult` and `CsvRow` types

#### C. CSV Import
- Add `year level` column to student CSV template (`csvParser.ts`):
  - Headers: `name, microsoft email, course, year level`
  - Parse and validate year level (1–5 integer, or empty/null)
- Update `userImport.ts` to pass `yearLevel` to `userRepository.create()`

#### D. Student Profile/Edit
- Could show year level in student-facing UI (optional)
- Admin can edit year level in Manage Users

#### E. Repositories
- Update `userRepository.create()` signature to accept `yearLevel`
- Update `userRepository.update()` to accept `yearLevel`
- Update any user creation in seed data

### Files Changed
| File | Change |
|------|--------|
| `supabase-schema.sql` | Add migration for `yearLevel` column |
| `lib/repositories/interfaces.ts` | Add `yearLevel` to `UserData` |
| `lib/repositories/supabase.ts` | Update `create()`, `update()` for `yearLevel` |
| `lib/services/csvParser.ts` | Add `year level` column to student template |
| `lib/services/userImport.ts` | Pass `yearLevel` to repository |
| `lib/models/index.ts` | Optionally add `yearLevel` to `User` model |
| `lib/repositories/interfaces.ts` | Add `yearLevel` to `CsvRow` if not there |

### Effort
~100 lines.

---

## P7 — Batch Year-Level Promotion (Deans only)

### What
Deans can promote all students in their department by one year level. Students at year 5 are marked as "graduated" (a new status field or `deletedAt = NOW()` or a separate flag).

### Prerequisites
- P6 (year level exists on students)
- P8 (courses are mapped to departments — to determine which students belong to which department)

### Implementation

#### A. Controller
```typescript
async function promoteStudents(deanId: string): Promise<{ promoted: number; graduated: number }>
```
- Find department via `departments.deanId`
- Find all students in that department (via course→department mapping, or by departmentId on the user record)
- Set `yearLevel = yearLevel + 1` for all students with `yearLevel < 5`
- Set `yearLevel = 5` and a new `graduatedAt` timestamp for students at year 5 (or set `deletedAt`)
- Audit log

#### B. API
`POST /api/dean/students/promote` — protected for DEAN role

#### C. UI
On the Dean dashboard or Department Reports page, add a "Promote Students" button:
- Shows: "This will advance all students in your department by one year level. Students at year 5 will be marked as graduated. Continue?"
- Shows result: "Promoted 120 students. 30 graduated."

#### D. Student-Department Resolution
Since students don't currently have a `departmentId` (they have `course` but no department mapping), we need P8 first. **Alternative**: temporarily, we could match by looking up which department owns the course.

### Files Changed
| File | Change |
|------|--------|
| `lib/controllers/student-promotion.ts` (new) | `promoteStudents(deanId)` |
| `app/api/dean/students/promote/route.ts` (new) | API route |
| `app/dean/page.tsx` or `app/dean/students/page.tsx` | Add promote button |
| `components/Sidebar.tsx` | Add to DEAN nav (if new page) |

### Effort
~150 lines.

---

## P8 — Course ↔ Department Mapping

### What
A new `courses` table connecting courses to their parent department.

### Database
```sql
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,           -- "Bachelor of Science in Information Technology"
  code TEXT NOT NULL UNIQUE,    -- "BSIT"
  "departmentId" TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration
- Seed with initial data: CCS → BSIT, BSCS
- Existing `users.course` stores course CODE (e.g., "BSIT")
- Later, `users.course` could become a FK to `courses.id`

### UI
- Admin page to manage courses (CRUD): `/admin/courses`
- Show department, course code, course name
- Link from departments page

### Student View
- When booking/registering, course dropdown is filtered by department
- Import CSV: `course` column auto-validates against the courses table

### Files Changed
| File | Change |
|------|--------|
| `supabase-schema.sql` | New `courses` table + seed data |
| `lib/repositories/interfaces.ts` | New `ICourseRepository` interface, `CourseData` type |
| `lib/repositories/supabase.ts` | Implement `ICourseRepository` |
| `lib/repositories/factory.ts` | Export course repository |
| `lib/controllers/courses.ts` (new) | CRUD controller |
| `app/api/admin/courses/route.ts` (new) | Admin API |
| `app/admin/courses/page.tsx` (new) | Admin UI |
| `lib/access.ts` | Add `/admin/courses` |
| `components/Sidebar.tsx` | Add nav link (ADMIN only) |

### Effort
~250 lines.

---

## Summary File Map

| Priority | Feature | Files Changed/New | Effort |
|----------|---------|------------------|--------|
| P1 | Line Graph | 1 file | ~150 loc |
| P2 | Storage Indicator | 3–4 files | ~50 loc |
| P3 | Soft-Delete | 10–12 files | ~300 loc |
| P4 | Dump: Consultations | 6–7 files | ~200 loc |
| P5 | Dump: Students | 4–5 files | ~150 loc |
| P6 | Year Level | 5–6 files | ~100 loc |
| P7 | Batch Promotion | 3–4 files | ~150 loc |
| P8 | Course↔Department | 8–9 files | ~250 loc |

**Total**: ~1,350 lines across ~25–30 files.

---

## Notes & Caveats

- All new pages need entries in `lib/access.ts` and `components/Sidebar.tsx` plus the `group_access` seed SQL
- All repository additions need exports from `lib/repositories/factory.ts`
- Supabase schema changes (`supabase-schema.sql`) should be applied to the live database after deployment
- P7 (batch promotion) is explicitly blocked on P8 (course mapping) unless we use a shortcut like looking up students by departmentId (if we add departmentId to students during P6)

## Database Migration Order

To avoid conflicts, apply schema migrations in this order:

1. `ALTER TABLE users ADD COLUMN "deletedAt" TIMESTAMPTZ;` (P3)
2. `ALTER TABLE users ADD COLUMN "yearLevel" INTEGER CHECK ("yearLevel" BETWEEN 1 AND 5);` (P6)
3. `CREATE TABLE courses (...)` + seed data (P8)
