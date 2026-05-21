# E-Consultation Feature Plan

## Progress

| Phase | Status |
|-------|--------|
| **1. Availability Rules Engine** | ✅ **Done** |
| **2. Faculty Dashboard Tabs** | ✅ **Done** |
| **3. Faculty Cancel Flow** | ✅ **Done** |
| **4. Student Cancellation** | ✅ **Done** |
| **5. Faculty-to-Faculty Meetings** | ✅ **Done** |
| **6. Sync Tracking Fields** | ✅ **Done** |
| **7. Teams Sync Orchestration** | ✅ **Done** |
| **8. Conflict Detection w/ Teams** | ✅ **Done** |
| **9. Enhanced Booking (Title, Desc, Attendees)** | ✅ **Done** |
| — | — |
| **Architecture: FacultySchedule removed** | ✅ **Done** |
| **Architecture: Date range on availability rules** | ✅ **Done** |
| — | — |
| **10. Department & Dean Role** | ❌ **Remaining** |
| **11. ETL — Bulk User Import (CSV)** | ❌ **Remaining** |
| **12. Email-based Auth & Password Setup** | ❌ **Remaining** |
| **13. Consultation Completion (Action Taken)** | ❌ **Remaining** |
| **14. Attendee Permissions** | ❌ **Remaining** |
| **15. Reports & Export** | ❌ **Remaining** |

## Overview

Transform the MVP booking system into a complete academic consultation platform with:
- App-level availability rules with date range support
- Faculty-to-faculty internal meetings
- Optional MS Teams calendar sync via Graph API
- Department management with Dean oversight
- Bulk user import (ETL) via CSV
- Email-based password setup and reset
- Consultation completion tracking (action taken, remarks)
- Reports and CSV export

---

## Phase 1: Availability Rules Engine ✅ *(Implemented)*

Faculty configures app-level rules per day-of-week. Students are blocked from booking outside those rules.

### 1A. Prisma Model

```prisma
model FacultyAvailabilityRule {
  id        String  @id @default(cuid())
  facultyId String
  dayOfWeek Int     // 0=Monday, 6=Sunday
  isBlocked Boolean @default(false)
  startTime String? // "15:00" — null means full day available
  endTime   String? // "19:00"
  startDate String  // "2026-01-15" — when this rule becomes active
  endDate   String? // "2026-06-30" — optional, rule is disabled after this date

  faculty User @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  @@unique([facultyId, dayOfWeek, startDate])
}
```

### 1B. Architecture Notes

- **Rule date range**: Rules have `startDate` (required) and `endDate` (optional). If `endDate` is set and in the past, the rule is automatically disabled — no manual action needed.
- **`findActiveRule(facultyId, date)`**: Finds the active rule for a date by matching `dayOfWeek`, filtering by `startDate <= date <= endDate` (or no endDate), and returning the one with the latest `startDate`.
- **Booking calendar**: Derives available time blocks from rules on-the-fly (generates 1-hour slots within the rule's time window).
- **Seed defaults**: 21 rules per faculty (7 days × 3 faculty), Mon–Fri 08:00–18:00, Sat–Sun blocked, all starting `"2026-01-01"`.

### 1C. Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | `FacultyAvailabilityRule` model |
| `lib/models/index.ts` | `AvailabilityRule` type |
| `lib/repositories/interfaces.ts` | `IAvailabilityRuleRepository` |
| `lib/repositories/prisma.ts` | Prisma implementation |
| `lib/repositories/factory.ts` | Factory export |
| `lib/controllers/availabilityRules.ts` | Controller with `findActiveRule()`, `getEffectiveHours()`, `isSlotAllowed()` |
| `app/api/availability-rules/route.ts` | GET list, POST upsert |
| `app/faculty/availability/page.tsx` | UI with date range picker + day cards |
| `components/BookingCalendar.tsx` | Rules-based calendar with month grid |

---

## Phase 2: Faculty Dashboard Tabs ✅ *(Implemented)*

Faculty sees PENDING / APPROVED / ALL as separate views with count badges.

### Files

| File | Action |
|------|--------|
| `components/AppointmentCard.tsx` | Status-aware actions |
| `components/FacultyAppointmentTabs.tsx` | Tab bar with badges |
| `app/faculty/page.tsx` | Tabbed dashboard |

---

## Phase 3: Faculty Cancel Flow ✅ *(Implemented)*

Faculty cancels APPROVED appointments → status set to CANCELLED.

---

## Phase 4: Student Cancellation ✅ *(Implemented)*

Student cancels their own PENDING requests. Separate dedicated route `/api/appointments/[id]/student-cancel`.

---

## Phase 5: Faculty-to-Faculty Internal Meetings ✅ *(Implemented)*

Full CRUD for `InternalMeeting` with participant management, conflict detection (appointments + meetings + Teams calendar).

### Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | `InternalMeeting`, `InternalMeetingParticipant`, enums |
| `lib/services/conflictDetection.ts` | Conflict detection service |
| `lib/controllers/meetings.ts` | CRUD + respond + conflicts |
| `app/api/meetings/*` | Full REST API |
| `app/faculty/meetings/*` | List, new (with live conflict checker), detail pages |

---

## Phase 6: Sync Tracking Fields ✅ *(Implemented)*

- `TeamsSyncStatus` enum: `UNWRITTEN`, `WRITTEN`, `FAILED`
- Sync tracking fields on `Appointment`
- `approveAppointment()` sets `UNWRITTEN` — no inline Teams API call
- Sync status badges on `AppointmentCard` (green/amber/red)
- Retry sync button for failed appointments
- Booking ticket detail page at `/appointments/[id]`

---

## Phase 7: Teams Sync Orchestration ✅ *(Implemented)*

- `syncPendingAppointments()` service with 5-retry policy
- `POST /api/admin/sync-teams` — admin trigger
- `GET /api/admin/sync-teams/status` — status endpoint
- `TeamsSyncPanel` component on admin dashboard
- This app writes to DB only — external cron service calls the trigger endpoint

---

## Phase 8: Conflict Detection with Teams ✅ *(Implemented)*

- `getCalendarView()` in Graph API service (requires `Calendars.Read` permission)
- Teams calendar events shown as `type: "teams"` conflicts
- All conflict sources are advisory (warns, does not block)

---

## Phase 9: Enhanced Booking ✅ *(Implemented)*

### Changes

- `Appointment` gains `title` (String?) and `description` (String?)
- `AppointmentAttendee` model with `AttendeeStatus` enum (`INVITED`, `ACCEPTED`, `DECLINED`)
- `requestAppointment()` accepts `title`, `description`, `attendeeIds`
- Additional attendees validated as FACULTY role only
- `BookingForm` modal: title (required), description (optional), faculty multi-select
- `AppointmentCard` shows title, description (truncated), attendee badges

---

## Architecture Changes

### FacultySchedule Removed

The `FacultySchedule` model (manual slot creation) has been removed entirely. Faculty no longer manually create individual date/time slots.

**What changed:**
- `FacultySchedule` model deleted from schema
- `scheduleId` removed from `Appointment` — now has `date`, `startTime`, `endTime` directly
- All `scheduleRepository.*()` calls removed from controllers
- `AvailabilityForm` and `ScheduleCard` components deleted
- Student dashboard `BookingCalendar` now derives slots from availability rules
- Faculty dashboard "My Created Slots" table and "Create Availability Window" form removed
- Faculty dashboard now shows a link to `/faculty/availability` instead
- Seed script no longer creates schedule records

**Booking flow:**
1. Faculty sets availability rules (day-of-week + time window + date range)
2. Student picks a faculty, sees a calendar with available days highlighted
3. Clicking a day generates 1-hour time blocks from the active rule
4. Student books a block → `Appointment` created with `date`, `startTime`, `endTime`

### Date Range on Availability Rules

`FacultyAvailabilityRule` now has `startDate` (required) and `endDate` (optional).

**Behavior:**
- Rule is active when `startDate <= currentDate <= endDate` (or no endDate)
- Rules with past `endDate` are automatically treated as blocked
- Unique constraint changed to `@@unique([facultyId, dayOfWeek, startDate])`
- Faculty availability UI shows "Effective From" / "Effective Until" date pickers
- `findActiveRule()` in controller handles date-range filtering

---

## Phase 10: Department & Dean Role ❌

### 10A. Schema

```prisma
model Department {
  id     String @id @default(cuid())
  name   String // "College of Computer Studies"
  code   String @unique // "CCS"
  deanId String?
  dean   User?  @relation("DeanDepartment")
  users  User[]
}
```

Add `DEAN` to `Role` enum. Add `departmentId` to `User`.

### 10B. Dean Role Behavior

Dean is **Faculty+** — has all faculty capabilities plus additional dean-scoped features.

**Dean can do everything a Faculty can:**
- Own appointment management (approve/reject/complete/cancel)
- Availability rules configuration
- Faculty meetings (internal)
- Faculty dashboard with calendar timeline

**Plus Dean-specific scope:**
- Can only see **their own department's** faculty in department views
- Can upload faculty AND students via CSV (see Phase 11)
- Can invite faculty from **other departments** to meetings (cross-department)
- Has `/dean/*` route group for department-specific pages
- Dean dashboard shows: department faculty list, department appointment metrics, upload, reports

**Route resolution:**
- `/faculty/*` — shared by Faculty and Dean (same components)
- `/dean/*` — Dean-only department pages (additional scope)
- `/admin/*` — Admin only

### 10C. Route Protection

Update `proxy.ts` for `DEAN` role:
- `/dean/*` — Dean and Admin only
- `/admin/*` — Admin only (Denied for Dean)
- `/faculty/*` — Faculty only (Dean has separate dashboard)

### 10D. Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `DEAN` in Role, + `Department` model, + `departmentId` on User |
| `lib/models/index.ts` | + `Department` type |
| `lib/repositories/interfaces.ts` | + Department repository methods |
| `lib/repositories/prisma.ts` | + Department Prisma repo |
| `lib/repositories/factory.ts` | + Department repo export |
| `proxy.ts` | + DEAN route rules |
| `app/dean/page.tsx` | New — Dean dashboard |
| `app/dean/faculty/page.tsx` | New — Department faculty list |
| `app/dean/appointments/page.tsx` | New — Department appointments |
| `app/dean/upload/page.tsx` | New — CSV upload page |
| `app/dean/reports/page.tsx` | New — Reports |
| `components/Sidebar.tsx` | + Dean sidebar links |
| `prisma/seed.ts` | + Sample departments + deans |

---

## Phase 11: ETL — Bulk User Import (CSV) ❌

### 11A. CSV Format

```
Name | Microsoft Email | Department | Dean (true/false)
```

- **Email domain** must be `@itmlyceumalabang.onmicrosoft.com` — validated server-side
- **Department** nullable → if null, user is a guest (STUDENT role)
- **Dean** defaults to `false`:
  - `false` + department provided → FACULTY
  - `true` + department provided → DEAN
  - If null → treated as `false`

### 11B. Upload Rules

| Uploader | Can upload | Dest role |
|---|---|---|
| **Dean** | Faculty + Students | FACULTY (with dept), STUDENT (no dept) |
| **Faculty** | Students only | STUDENT |

### 11C. Upload Flow

1. Dean/faculty uploads CSV file via `POST /api/admin/import-users` or `/api/faculty/import-students`
2. Server-side parsing (no client-side processing)
3. For each row:
   - Validate email domain (`@itmlyceumalabang.onmicrosoft.com`)
   - Check for duplicates
   - Create user with `passwordHash: null`, `hasLoggedInBefore: false`
   - Generate `PasswordResetToken` (15-min expiry, see Phase 12)
   - Queue email send
4. Return results table: ✅ created, ⏭ skipped, ❌ errors

### 11D. Files

| File | Action |
|------|--------|
| `app/api/admin/import-users/route.ts` | New — Dean CSV upload |
| `app/api/faculty/import-students/route.ts` | New — Faculty CSV upload |
| `lib/services/csvParser.ts` | New — CSV parsing + validation |
| `lib/services/userImport.ts` | New — Import orchestration |
| `app/dean/upload/page.tsx` | New — Upload UI |
| `app/faculty/upload/page.tsx` | New — Upload UI (students only) |

---

## Phase 12: Email-based Auth & Password Setup ❌

### 12A. Email Service

- **Local dev**: Nodemailer + Gmail SMTP (App Password from sender's Gmail)
- **Vercel** (future): Resend HTTP API (works on Vercel, free tier: 100 emails/day)

### 12B. PasswordResetToken Model

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime // now + 15 min
  usedAt    DateTime?
  createdAt DateTime @default(now())
}
```

### 12C. Flow: First-Time Password Setup

1. User created via ETL → `passwordHash: null`, `hasLoggedInBefore: false`
2. System generates crypto-random token, stores `PasswordResetToken` with 15-min expiry
3. Email sent: "Set your password: https://app/setup-password?token=<token>"
4. User clicks link → `/setup-password?token=xxx`
   - Validate: token exists, not expired, not used
   - Show password creation form
   - On submit: `passwordHash = hash(password)`, `hasLoggedInBefore = true`, `token.usedAt = now()`
5. User can now log in normally

### 12D. Flow: Password Reset

1. User goes to `/register` and enters email
2. If email found + `hasLoggedInBefore = true`:
   - "This email is already registered. Would you like to change your password?"
   - Yes → generate token, send reset email
3. Same `/setup-password` page handles both setup and reset

### 12E. Registration Page Changes

`/register` becomes email-first:
1. User enters email only
2. System checks DB:
   - **Not found** → "This email is not in the system. Please contact your dean."
   - **Found + `hasLoggedInBefore = false`** → "First-time setup!" → sends setup-password email
   - **Found + `hasLoggedInBefore = true`** → "Already registered. Send password reset?" → sends reset email
3. No more name/password fields on registration — those come from ETL + setup flow

### 12F. Logging In

- User logs in with email + password (standard Credentials provider)
- On successful login: update `lastLoginAt` timestamp
- If user has `passwordHash: null` (never set up) → login fails with "Please set up your password first"

### 12G. Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `PasswordResetToken`, + `hasLoggedInBefore`, `lastLoginAt` on User |
| `lib/email.ts` | New — Email sending service (Nodemailer) |
| `lib/services/passwordReset.ts` | New — Token generation, validation, password set |
| `app/api/auth/send-setup-email/route.ts` | New — Trigger setup/reset email |
| `app/api/auth/reset-password/route.ts` | New — Validate token + set password |
| `app/setup-password/page.tsx` | New — Password setup/reset page (token in URL) |
| `app/(auth)/register/page.tsx` | Rewrite — email-first flow |
| `app/(auth)/login/page.tsx` | Update — handle `passwordHash: null` case |

---

## Phase 13: Consultation Completion (Action Taken) ❌

### 13A. Schema

Add to `Appointment`:
```prisma
actionTaken       String?  // required when completing
additionalRemarks String?
```

### 13B. Flow

1. Faculty clicks **"Mark Complete"** on an approved appointment
2. Instead of immediate status change → modal opens:
   - **Action Taken** (required) — free text field
   - **Additional Remarks** (optional) — textarea
3. On submit → `status = COMPLETED`, `actionTaken` and `additionalRemarks` saved

### 13C. UI

- `AppointmentCard`: Show action taken and remarks on completed appointments
- Booking ticket page: Show completion details
- Reports: Action Taken distribution analysis

---

## Phase 14: Attendee Permissions ❌

Enhance the `AppointmentAttendee` system with role-based invitation rules:

| Inviter | Can add | Status |
|---|---|---|
| Faculty / Dean | Anyone (Faculty, Dean, Student) | `INVITED` |
| Student (invited by Faculty) | Fellow Students only | `INVITED` (requires faculty approval) |
| Student (is the creator) | Anyone | `INVITED` (pending faculty approval) |

"Approval" means the primary faculty can accept/reject pending attendees.

### Files

| File | Action |
|------|--------|
| `lib/controllers/appointments.ts` | + attendee approval/rejection endpoints |
| `app/api/appointments/[id]/attendees/route.ts` | New — Attendee management |
| `components/AppointmentCard.tsx` | + pending attendee badges |
| `app/appointments/[id]/page.tsx` | + Attendee management UI |

---

## Phase 15: Reports & Export ❌

### 15A. Reports

| Report | What it shows | Access |
|---|---|---|
| **Faculty Consultation Load** | # consultations per faculty by date range, completion rate | Dean, Admin |
| **Department Summary** | Total consultations, status breakdown, per-department | Dean, Admin |
| **Action Taken Distribution** | Frequency table of actions taken (free-text aggregation) | Dean, Admin |
| **Export to CSV** | Raw appointments table filtered by date range, department, status | Dean, Admin |

### 15B. Design

- Simple table-based reports with date range filter
- Download as CSV (no charts initially — can add later)
- Dean sees only their department's data
- Admin sees all departments

### Files

| File | Action |
|------|--------|
| `lib/controllers/reports.ts` | New — Report queries |
| `app/api/reports/faculty-load/route.ts` | New |
| `app/api/reports/department-summary/route.ts` | New |
| `app/api/reports/export-csv/route.ts` | New |
| `app/dean/reports/page.tsx` | Reports UI |
| `app/admin/reports/page.tsx` | Reports UI (all departments) |

---

## Feature Flagging

### MS Teams Integration

| Flag | Purpose | Phase |
|------|---------|-------|
| `FEATURE_CREATE_TEAMS_MEETING` | Master toggle for all Teams sync features | 6+ |
| `NEXT_PUBLIC_FEATURE_TEAMS` | Shows/hides Microsoft SSO button on login | Any |

---

## Implementation Order

```
Phase 10 ──> Phase 12 ──> Phase 11 ──> Phase 13 ──> Phase 15 ──> Phase 14
 (Depts)    (Email Auth)  (ETL)       (Action)     (Reports)    (Permissions)
```

### Dependency Map

- **Phase 10 (Departments)** — Foundation. Required by Phases 11, 14, 15.
- **Phase 12 (Email Auth)** — Required by Phase 11 (new users need setup emails).
- **Phase 11 (ETL)** — Builds on 10 + 12. Users created via CSV need departments and email setup.
- **Phase 13 (Action Taken)** — Independent. Can be done in parallel with 14.
- **Phase 15 (Reports)** — Builds on 10 (department filtering) and 13 (action taken data).
- **Phase 14 (Permissions)** — Builds on 10 (role/department checks).

---

## Remaining (External / Manual)

### 1. MS Teams Admin Consent

`OnlineMeetings.ReadWrite` (delegated) requires tenant admin consent for the Entra ID app registration.

**Direct consent URL:**
```
https://login.microsoftonline.com/38fc09ac-2ea6-4353-9730-4c9371ff4843/v2.0/adminconsent?client_id=270f2919-be22-4209-b7b5-5a7f6a4a93b9&scope=https://graph.microsoft.com/OnlineMeetings.ReadWrite&redirect_uri=http://localhost:3000/login
```

### 2. Teams Sync Cron Job (Separate Service)

This app writes to the database. A separate external service calls:
```
POST /api/admin/sync-teams
```

### 3. Email Service Setup

For Phase 12, one of:
- **Gmail SMTP** (local dev): Enable 2FA, generate App Password
- **Resend** (Vercel): Sign up at resend.com, get API key
- **Microsoft Graph API**: Requires `Mail.Send` permission on Azure AD app
