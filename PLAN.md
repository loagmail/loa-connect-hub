# E-Consultation Feature Plan

## Progress

| Phase | Status |
|-------|--------|
| **1. Availability Rules Engine** | ✅ **Done** |
| **2. Faculty Dashboard Tabs** | ✅ **Done** |
| **3. Faculty Cancel Flow** | ✅ **Done** |
| **4. Student Cancellation** | ✅ **Done** |
| 5. Faculty-to-Faculty Meetings | ✅ **Done** |
| 6. Sync Tracking Fields | ✅ **Done** |
| 7. Teams Sync Orchestration | ✅ **Done** |
| 8. Conflict Detection w/ Teams | ✅ **Done** |

## Overview

Transform the MVP booking system into a complete academic consultation platform with app-level availability rules, faculty-to-faculty meetings, and optional MS Teams calendar integration.

**Core Principle:** Faculty controls their availability at the app level. Students can only book within those bounds. MS Teams integration is optional and feature-flagged.

---

## Phase 1: Availability Rules Engine ✅ *(Implemented)*

Faculty configures app-level rules per day-of-week. Students are blocked from booking outside those rules.

### 1A. New Prisma Model

```prisma
model FacultyAvailabilityRule {
  id        String  @id @default(cuid())
  facultyId String
  dayOfWeek Int     // 0=Monday, 6=Sunday
  isBlocked Boolean @default(false)
  startTime String? // "15:00" — null means full day available
  endTime   String? // "19:00"

  faculty User @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  @@unique([facultyId, dayOfWeek])
}
```

### 1B. New Repository Interface + Implementation

- `IAvailabilityRuleRepository` — CRUD + listByFaculty + getByFacultyAndDay
- Prisma implementation
- Factory registration

### 1C. New Controller

- `listAvailabilityRules(facultyId)`
- `upsertAvailabilityRule(input)` — create or update a rule per dayOfWeek
- `getEffectiveHours(facultyId, dayOfWeek)` — returns available window or "blocked"

### 1D. New API Routes

- `GET /api/availability-rules` — list rules for current faculty
- `POST /api/availability-rules` — upsert a rule (faculty only)

### 1E. UI: Faculty Availability Settings Page

**`/faculty/availability`** — New page with:
- Grid of 7 cards (one per day, Mon–Sun)
- Each card: toggle "Block entire day" + optional time picker (start/end)
- Visual summary of current rules
- Sidebar link (visible only for faculty)

### 1F. Update Student Booking Flow

In `listAvailableSchedules()`:
- After fetching schedules, filter against each faculty's availability rules
- Remove: slots on blocked days
- Remove: slots outside allowed time windows
- This is server-side, students can't bypass it

**Scope:** Availability rules only apply to **students booking via the app**. Faculty-to-faculty meetings (Phase 5) use a separate `InternalMeeting` model and are not filtered by these rules — faculty book directly with each other.

### 1H. Seed Defaults

When a faculty account is created (or on first login), seed sensible defaults:
- Monday–Friday: `isBlocked=false`, `startTime="08:00"`, `endTime="18:00"`
- Saturday–Sunday: `isBlocked=true`
- Faculty can customize these on the `/faculty/availability` page at any time

### 1G. Calendar-Based Booking UI (Student)

Replace the flat card grid with an interactive calendar view for browsing and booking availability.

**Design approach:** A monthly/weekly calendar grid where available slots are highlighted. The student navigates by day/week, not by scrolling through an endless list.

**Component: BookingCalendar**
- Monthly grid view showing days with available slots (highlighted)
- Click a highlighted day → expands to show time slots for that day grouped by faculty
- Each time slot shows: faculty name, time range, "Book" button
- Empty days and blocked days are visually dimmed or hidden
- Tabs to filter by faculty (or show all)

**Student flow:**
```
┌──────────────────────────────────────────┐
│  [◀]  May 2026  [▶]                      │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun       │
│        ┌────┐ ┌────┐                     │
│        │  5 │ │  6 │                     │
│        │ 3  │ │ 5  │  ← number of slots  │
│        │slts│ │slts│                     │
│        └────┘ └────┘                     │
│  ┌────┐ ┌────┐ ┌────┐                   │
│  │ 12 │ │ 13 │ │ 14 │                   │
│  │ 2  │ │ 0  │ │ 4  │                   │
│  │slts│ │    │ │slts│                   │
│  └────┘ └────┘ └────┘                   │
└──────────────────────────────────────────┘

  Clicking May 6 (3 slots):
  ┌────────────────────────────────┐
  │ Faculty         Time           │
  │ Dr. Smith       09:00-10:00  ▶ │
  │ Dr. Smith       10:00-11:00  ▶ │
  │ Prof. Jones     14:00-15:00  ▶ │
  └────────────────────────────────┘
```

**Where to place it:**
- Replace the "Available Consultation Slots" section on the student dashboard (`/student`)
- Or create a dedicated `/student/book` page with the calendar as the primary view
- Keep the dashboard for metrics + upcoming appointments only

**Filter by faculty:**
- Dropdown or sidebar to filter the calendar by a specific faculty member
- Helps students focus on their preferred faculty's availability

### New/Modified Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `FacultyAvailabilityRule` model |
| `lib/models/index.ts` | + `AvailabilityRule` type |
| `lib/repositories/interfaces.ts` | + `IAvailabilityRuleRepository` |
| `lib/repositories/prisma.ts` | + `PrismaAvailabilityRuleRepository` |
| `lib/repositories/factory.ts` | + register factory |
| `lib/controllers/availabilityRules.ts` | New file |
| `app/api/availability-rules/route.ts` | New file |
| `app/faculty/availability/page.tsx` | New page |
| `components/Sidebar.tsx` | + link for faculty |
| `lib/controllers/schedules.ts` | Updated to filter by rules |
| `app/student/page.tsx` | Replace slot grid with calendar (or create `/student/book`) |
| `components/BookingCalendar.tsx` | New — interactive monthly calendar for booking |

---

## Phase 2: Faculty Dashboard Tabs ✅ *(Implemented)*

Faculty sees PENDING / APPROVED / ALL as separate views instead of one flat list.

### 2A. New Component: Tab Navigation

- Tab bar: **Pending** | **Approved** | **All**
- Each tab filters existing appointments by status
- Client-side filtering with URL search params for shareability

### 2B. Update Faculty Dashboard Page

- Add tab navigation above Appointment Cards section
- Keep metrics and schedule timeline as-is

### 2C. Appointment Card Updates

- Update `AppointmentCard` for faculty view to show relevant actions per status
- Cancel button only for APPROVED appointments

### Modified Files

| File | Action |
|------|--------|
| `components/AppointmentCard.tsx` | Updated with cancel, status-tab-aware |
| `app/faculty/page.tsx` | Add tab navigation + filtering |

---

## Phase 3: Faculty Cancel Flow ✅ *(Implemented)*

Faculty can cancel an approved appointment → restores slot availability + removes Teams event.

### 3A. New Controller Function

```ts
export async function cancelAppointment(id: string, facultyId: string) {
  // Verify ownership + APPROVED status
  // Restore schedule availability
  // Delete Teams meeting event (if teamsEventId exists)
  // Set status to CANCELLED
}
```

### 3B. New Status: `CANCELLED`

- Add to `AppointmentStatus` enum in Prisma schema
- Add to types in `lib/models/index.ts`
- Add to `AppointmentData` interface in repositories
- Update all UI badge components to handle it

### 3C. Update API Route

- `POST /api/appointments/[id]/cancel` — new action route
- Protected: faculty only, ownership check

### 3D. Update `AppointmentCard`

- If role=FACULTY and status=APPROVED: show "Cancel Meeting" button
- If role=STUDENT and status=CANCELLED: show "Cancelled" badge

### Modified Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `CANCELLED` in `AppointmentStatus` |
| `lib/models/index.ts` | + `CANCELLED` type |
| `lib/repositories/interfaces.ts` | + `CANCELLED` in type |
| `lib/controllers/appointments.ts` | + `cancelAppointment()` |
| `app/api/appointments/[id]/[action]/route.ts` | + cancel handler |
| `components/AppointmentCard.tsx` | + cancel button + cancelled badge |
| `components/StatusBadge.tsx` | + cancelled variant |

---

## Phase 4: Student Cancellation ✅ *(Implemented)*

### 4A. Flow

```
Student books → PENDING → Student cancels → CANCELLED (slot restored)
                          └─ Faculty still needs to approve
Student books → PENDING → Faculty approves → APPROVED → only faculty can cancel
```

- Student can cancel their own **PENDING** requests at any time (before faculty reviews)
- **APPROVED** appointments: only faculty can cancel (Phase 3). Student cancel on APPROVED is rejected.
- When cancelled → schedule slot is restored, other students can book it

### 4B. Controller

- `studentCancelAppointment(id, studentId)` — ownership check, status=PENDING guard, restores slot, sets CANCELLED

### 4C. API Route

- `POST /api/appointments/[id]/student-cancel` — separate route file (not part of `[action]` route)
- Route resolution: literal `student-cancel` takes priority over `[action]` dynamic segment

### 4D. UI

- AppointmentCard for role=STUDENT + status=PENDING: shows "Cancel Request" button
- No confirmation dialog (kept simple, matches Phase 3 style)

### Modified Files

| File | Action |
|------|--------|
| `lib/controllers/appointments.ts` | + `studentCancelAppointment()` |
| `app/api/appointments/[id]/student-cancel/route.ts` | New — dedicated student cancel route |
| `components/AppointmentCard.tsx` | + cancel button for student view |

---

## Phase 5: Faculty-to-Faculty Internal Meetings ✅ *(Implemented)*

### 5A. New Prisma Models & Enums

```prisma
enum MeetingStatus { CONFIRMED, CANCELLED }
enum ParticipantStatus { PENDING, ACCEPTED, DECLINED }

model InternalMeeting {
  id          String        @id @default(cuid())
  title       String
  description String?
  date        String
  startTime   String
  endTime     String
  organizerId String
  teamsEventId String?
  teamsLink   String?
  status      MeetingStatus @default(CONFIRMED)
  createdAt   DateTime      @default(now())

  organizer    User                          @relation("OrganizedMeetings")
  participants InternalMeetingParticipant[]
}

model InternalMeetingParticipant {
  id        String            @id @default(cuid())
  meetingId String
  userId    String
  status    ParticipantStatus @default(PENDING)

  meeting InternalMeeting @relation(onDelete: Cascade)
  user    User
  @@unique([meetingId, userId])
}
```

### 5B. Repository

- `IMeetingRepository` interface with: create, findById (with includes), listByOrganizer, listByParticipant, update, addParticipant, updateParticipantStatus, getParticipants
- Conflict queries: `listConflictingAppointments(facultyId, date, startTime, endTime)` — joins through FacultySchedule for date/time overlap
- `listConflictingMeetings(facultyId, date, startTime, endTime)` — checks CONFIRMED internal meetings

### 5C. Conflict Detection Service

- `checkConflicts(facultyIds, date, startTime, endTime)` — checks both appointments and meetings for all given faculty IDs
- Returns advisory list of conflicts (does not block booking)

### 5D. Controller

- `createMeeting()` — creates meeting + adds participants (organizer auto-ACCEPTED)
- `getMeetingsForUser()` — merges organized + invited, deduplicated
- `getMeetingById()` — single meeting with all includes
- `respondToMeeting()` — accept/decline by participant
- `cancelMeeting()` — organizer only, sets CANCELLED
- `getConflicts()` — wraps conflict detection service

### 5E. API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/meetings` | GET | List meetings for current user |
| `/api/meetings` | POST | Create new meeting |
| `/api/meetings/[id]` | GET | Meeting detail |
| `/api/meetings/[id]` | PATCH | Cancel meeting (organizer only) |
| `/api/meetings/[id]/respond` | POST | Accept/decline invitation |
| `/api/meetings/conflicts` | POST | Check conflicts for a set of faculty |
| `/api/auth/users` | GET | List all faculty users (for participant picker) |

### 5F. UI Pages

- **`/faculty/meetings`** — List view with metrics (confirmed/total), meeting cards with status badges, participant avatars with color-coded status
- **`/faculty/meetings/new`** — Form with: title, description, date, time range, faculty multi-select checkboxes, **real-time conflict checking** (debounced 500ms)
- **`/faculty/meetings/[id]`** — Detail view with: meeting info, description panel, Teams link, respond buttons (Accept/Decline for invitees with PENDING status), Cancel Meeting button (organizer only), participant list with status badges
- Sidebar updated with "Meetings" link for FACULTY role (before Availability Rules)

### 5G. Implementation Notes

- Conflict checking is **advisory** — users can proceed despite conflicts
- Organizer is automatically added as ACCEPTED participant
- Non-organizer invitees see Accept/Decline only when their status is PENDING
- No Teams sync yet — `teamsEventId`/`teamsLink` fields are structural for Phase 7

### New/Modified Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `InternalMeeting`, `InternalMeetingParticipant`, enums, User relations |
| `lib/models/index.ts` | + `MeetingStatus`, `ParticipantStatus`, `InternalMeeting`, `InternalMeetingParticipant` types |
| `lib/repositories/interfaces.ts` | + `IMeetingRepository` + data types |
| `lib/repositories/prisma.ts` | + `meetingRepository` implementation |
| `lib/repositories/factory.ts` | Export `meetingRepository` |
| `lib/services/conflictDetection.ts` | New — conflict detection |
| `lib/controllers/meetings.ts` | New — meeting CRUD + respond + conflicts |
| `app/api/meetings/route.ts` | New |
| `app/api/meetings/[id]/route.ts` | New |
| `app/api/meetings/[id]/respond/route.ts` | New |
| `app/api/meetings/conflicts/route.ts` | New |
| `app/api/auth/users/route.ts` | New — faculty list for participant picker |
| `app/faculty/meetings/page.tsx` | New — meetings list |
| `app/faculty/meetings/new/page.tsx` | New — create meeting form |
| `app/faculty/meetings/[id]/page.tsx` | New — meeting detail |
| `components/Sidebar.tsx` | + Meetings link for faculty |

---

## Phase 6: Sync Tracking Fields ✅ *(Implemented)*

### 6A. Schema Changes — Appointment Model

```prisma
enum TeamsSyncStatus { UNWRITTEN, WRITTEN, FAILED }

model Appointment {
  // ... existing fields
  teamsSyncStatus  TeamsSyncStatus @default(UNWRITTEN)
  teamsSyncRetries Int             @default(0)
  teamsSyncError   String?
  teamsSyncLastAttempt DateTime?
}
```

### 6B. approveAppointment() Decoupled

`approveAppointment()`:
- Sets `status = APPROVED`, `teamsSyncStatus = UNWRITTEN`
- **No Teams API call** — removed from route handler
- Orchestration layer (Phase 7) picks up UNWRITTEN records

### 6C. cancelAppointment() — Best-effort Teams Cleanup

`cancelAppointment()`:
- If `teamsSyncStatus = WRITTEN` → attempts Teams deletion (TODO for Phase 7)
- Status set to CANCELLED regardless of Teams outcome (never blocks)

### 6D. UI: Sync Status on AppointmentCard

- Green badge "Synced" ✅ — WRITTEN
- Amber badge "Pending Sync" ⏳ — UNWRITTEN (pulsing icon)
- Red badge "Sync Failed" ❌ — FAILED (with error tooltip)

### 6E. Retry Sync Button (Faculty)

- When `teamsSyncStatus = FAILED` → "Retry Sync" button visible
- Resets `teamsSyncRetries = 0`, `teamsSyncStatus = UNWRITTEN`, clears error
- Orchestrator picks it up on next cycle

### 6F. Booking Ticket Page (`/appointments/[id]`)

Client-side page accessible by both student and faculty:
- **Header:** Status badge + "Booking Ticket" title
- **People section:** Faculty and Student info side by side
- **Schedule section:** Date + time in indigo card
- **Teams Sync section** (if APPROVED):
  - ✅ WRITTEN — green card with "Join Teams Meeting" link
  - ⏳ UNWRITTEN — amber card "Pending, link available shortly"
  - ❌ FAILED — red card with error details + retry button
- **Timestamps:** Requested, updated, last sync attempt
- **Actions panel:** Context-sensitive buttons (student cancel, faculty approve/reject/complete/cancel/retry sync)
- "View Details" link added to AppointmentCard

### Modified Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `TeamsSyncStatus` enum, + sync fields on Appointment |
| `lib/models/index.ts` | + `TeamsSyncStatus` type, updated Appointment interface |
| `lib/repositories/interfaces.ts` | + sync fields in `AppointmentData` |
| `lib/controllers/appointments.ts` | Update approve: sets UNWRITTEN. Update cancel: best-effort Teams cleanup. + `retryTeamsSync()` |
| `app/api/appointments/[id]/[action]/route.ts` | Removed inline Teams API call from approve case |
| `app/api/appointments/[id]/retry-sync/route.ts` | New — retry sync endpoint |
| `components/AppointmentCard.tsx` | + sync status badge, retry button, View Details link |
| `app/appointments/[id]/page.tsx` | New — booking ticket detail page |

---

## Phase 7: Teams Sync Orchestration ✅ *(Implemented)*

### 7A. Orchestration Service

`lib/services/teamsSync.ts` — `syncPendingAppointments()`:

```
1. Fetch all appointments WHERE status = APPROVED AND teamsSyncStatus = UNWRITTEN
2. For each appointment:
   a. Find faculty's Microsoft access token (from Account table, provider = "azure-ad")
   b. If no token → skip (next cycle will retry)
   c. Call createOnlineMeeting() with:
      - subject: "Consultation: [student] & [faculty]"
      - startDateTime, endDateTime from schedule
   d. On success → save teamsLink, set teamsSyncStatus = WRITTEN
   e. On failure:
      - Increment teamsSyncRetries
      - Save error message
      - If retries >= 5 → set FAILED
      - If retries < 5 → leave UNWRITTEN (next cycle retries)
3. Return SyncResult { processed, succeeded, failed, skipped, errors[] }
```

### 7B. API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/admin/sync-teams` | Admin-only | Triggers sync immediately, returns SyncResult |
| `GET /api/admin/sync-teams/status` | Admin-only | Returns pendingCount, failedCount, writtenCount, lastSync, failedAppointments |

### 7C. Admin Dashboard — Sync Panel

New `TeamsSyncPanel` component showing:
- **4 metric cards:** Total Approved, Pending Sync (amber), Written to Teams (green), Sync Failed (red)
- **Sync Now button** — triggers POST /api/admin/sync-teams
- **Last sync timestamp**
- **Sync result summary** (processed/succeeded/failed/skipped)
- **Failed appointments table** — faculty, date/time, retries/5, error message
- Auto-refreshes status after sync

### 7D. Retry Policy

| Retry # | Action | teamsSyncStatus |
|---------|--------|-----------------|
| 0 | First attempt | UNWRITTEN |
| 1–4 | Failed, will retry | UNWRITTEN |
| 5 | Failed, max retries reached | FAILED |

### New/Modified Files

| File | Action |
|------|--------|
| `lib/services/teamsSync.ts` | New — orchestration service |
| `lib/repositories/interfaces.ts` | + `listPendingSync()` on IAppointmentRepository |
| `lib/repositories/prisma.ts` | + `listPendingSync()` implementation |
| `app/api/admin/sync-teams/route.ts` | New — trigger endpoint |
| `app/api/admin/sync-teams/status/route.ts` | New — status endpoint |
| `components/TeamsSyncPanel.tsx` | New — admin sync panel |
| `app/admin/page.tsx` | + TeamsSyncPanel imported and rendered |

---

## Phase 8: Conflict Detection with Teams ✅ *(Implemented)*

### 8A. Teams Calendar View

Added to `lib/services/graph.ts`:
```ts
export async function getCalendarView(
  accessToken: string,
  startDateTime: string,
  endDateTime: string
): Promise<CalendarEvent[]>
```
- Calls `GET /me/calendarView` with the delegated access token
- Requires `Calendars.Read` permission on the app registration
- Returns events with subject, start, end
- Best-effort: returns empty array on failure (non-blocking)

### 8B. Enhanced Conflict Detection

In `checkConflicts()`:
- Check app schedules (existing appointments + internal meetings) — unchanged
- If `FEATURE_CREATE_TEAMS_MEETING=true` AND faculty has Microsoft token (from Account table):
  - Call `getCalendarView()` with the token
  - Add Teams events as conflicts with `type: "teams"`
- All conflict sources are advisory — user can proceed despite any conflicts

### 8C. UI Update

New meeting form now shows Teams calendar conflicts with label:
- "Faculty X has a Teams calendar event: 'Meeting Title' at 14:00–15:00"
- Separately identified from app-level appointments and internal meetings

### New/Modified Files

| File | Action |
|------|--------|
| `lib/services/graph.ts` | + `getCalendarView()` function |
| `lib/services/conflictDetection.ts` | + Teams calendar check using delegated token |
| `app/faculty/meetings/new/page.tsx` | + `"teams"` conflict type in UI render |

## Feature Flagging

### MS Teams Integration

| Flag | Purpose | Phase |
|------|---------|-------|
| `FEATURE_CREATE_TEAMS_MEETING` | Master toggle for all Teams sync features | 6+ |
| `NEXT_PUBLIC_FEATURE_TEAMS` | Shows/hides Microsoft SSO button on login | Any |
| `TEAMS_AUTO_SYNC_ENABLED` | Enables cron-based auto-sync (vs manual only) | 7 |

### Current State

```
FEATURE_CREATE_TEAMS_MEETING=true   (structural flag for Phase 7 orchestration)
NEXT_PUBLIC_FEATURE_TEAMS=true      (keep to show SSO option)
```

### Degradation Behavior

When Teams is disabled or MS token is unavailable:
- **Phase 6:** Sync status stays UNWRITTEN. Faculty sees "Pending Sync" badge. No impact on booking flow.
- **Phase 7:** Orchestrator skips appointments where faculty has no Microsoft token.
- **Phase 8:** Conflict detection falls back to app-only mode.
- **Approval:** Always works — writes to database only (inline Teams API call removed in Phase 6).
- **Cancel:** Always works — updates status, Teams cleanup is best-effort.

---

## Schema Summary

### New Tables

| Table | Purpose | Phase |
|-------|---------|-------|
| `FacultyAvailabilityRule` | Per-day availability rules | 1 |
| `InternalMeeting` | Faculty-to-faculty meetings | 5 |
| `InternalMeetingParticipant` | Meeting participants | 5 |

### Modified Tables

| Table | Change | Phase |
|-------|--------|-------|
| `Appointment` | Add `teamsSyncStatus`, `teamsSyncRetries`, `teamsSyncError`, `teamsSyncLastAttempt` | 6 |
| `AppointmentStatus` | Add `CANCELLED` value | 3 |

### New Enums

| Enum | Values | Phase |
|------|--------|-------|
| `TeamsSyncStatus` | `UNWRITTEN`, `WRITTEN`, `FAILED` | 6 |
| `MeetingStatus` | `CONFIRMED`, `CANCELLED` | 5 |
| `ParticipantStatus` | `PENDING`, `ACCEPTED`, `DECLINED` | 5 |

---

## Implementation Order

```
Phase 1 ──> Phase 2 ──> Phase 3 ──> Phase 4 ──> Phase 5 ──> Phase 6 ──> Phase 7 ──> Phase 8
 (Rules)    (Tabs)      (Cancel)    (Student     (Meetings)   (Sync       (Sync        (Conflict)
                                      Cancel)                  Tracking)   Orchestr.)    w/ Teams)
```

All 8 phases complete. ✅

- **Phases 1–6:** App-only. No Microsoft dependency. Core booking flow improvements.
- **Phase 5:** Internal meetings. Conflict detection is app-only initially.
- **Phase 6:** Adds sync tracking fields. Approval is decoupled from Teams API calls.
- **Phase 7:** Orchestration service + API endpoint. This app only writes to the database — it does not run cron or background sync. A separate external service can call `POST /api/admin/sync-teams` on a schedule.
- **Phase 8:** Teams calendar conflict detection (requires sync + tokens to work).

## Remaining (External / Manual)

These are not code tasks — they require action outside this application.

### 1. MS Teams Admin Consent

`OnlineMeetings.ReadWrite` (delegated) requires tenant admin consent for the Entra ID app registration. Until granted, Microsoft sign-in fails with "Need admin approval" page.

**Direct consent URL:**
```
https://login.microsoftonline.com/38fc09ac-2ea6-4353-9730-4c9371ff4843/v2.0/adminconsent?client_id=270f2919-be22-4209-b7b5-5a7f6a4a93b9&scope=https://graph.microsoft.com/OnlineMeetings.ReadWrite&redirect_uri=http://localhost:3000/login
```

### 2. Teams Sync Cron Job (Separate Service)

This app only writes to the database. A separate external service or cron job should periodically call:

```
POST /api/admin/sync-teams
```

It reads `UNWRITTEN` appointments and writes Teams meeting links back to the DB. The service must be authenticated as an admin user (session cookie or API token).

For local testing, the admin can click **"Sync Now"** on the admin dashboard at `/admin`.

### 3. Seed Defaults

Already done — the seed script creates default availability rules for all faculty accounts (Mon–Fri 08:00–18:00, Sat–Sun blocked). Run with:

```
npx tsx prisma/seed.ts
```

---

## Phase 9: Enhanced Booking with Meeting Details & Multi-Faculty Attendees (In Progress)

### Problem

Currently, booking an appointment is a single-click action with no context — no title, no description, no agenda. The resulting Teams meeting (if synced) would be empty. Also, consultations often involve multiple faculty members (e.g., a panel), but the current model only supports one student and one faculty.

### Design

#### Booking Flow

```
Student browses available slots (calendar view)
  → clicks a time slot for primary faculty
  → modal/form opens with fields:
      • Title / Subject (required) — e.g. "Thesis Defense Consultation"
      • Description / Agenda (optional) — e.g. "Discuss Chapter 3 revisions"
      • Additional Faculty Attendees (optional multi-select)
        — only FACULTY-role users shown, no students
  → submits
```

#### What gets created

- **Appointment** record with new fields: `title`, `description`
- **AppointmentAttendee** records for each additional faculty attendee (status=INVITED)
- The primary faculty's time slot is consumed (existing behavior)
- Additional attendees do NOT consume separate slots — they are invited to the same meeting

#### Two-Level Validation

| Level | When | What it checks | Behavior |
|-------|------|----------------|----------|
| **1. App-level (immediate)** | On submit | Primary faculty's availability rules (don't disturb hours/days). Also check that selected attendees are FACULTY role. | Instant rejection — student can't submit |
| **2. Teams-level (async)** | Via cron | Faculty's Teams calendar for conflicts at the chosen time | Advisory — cron writes back a conflict flag, displayed on the booking ticket later |

#### AppointmentAttendee Model

```
model AppointmentAttendee {
  id            String            @id @default(cuid())
  appointmentId String
  userId        String
  status        AttendeeStatus    @default(INVITED)

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [userId], references: [id])

  @@unique([appointmentId, userId])
}

enum AttendeeStatus {
  INVITED
  ACCEPTED
  DECLINED
}
```

#### Appointment Model Changes

Add fields to existing `Appointment` model:

```prisma
model Appointment {
  // ... existing fields
  title       String?
  description String?
  attendees   AppointmentAttendee[]
}
```

#### Validation Rules

1. **Primary faculty** — availability rules checked immediately (existing Phase 1 logic)
2. **Additional attendees** — only FACULTY role allowed; student cannot invite fellow students (checked on submit)
3. **Teams calendar conflicts** — not checked on submit; handled asynchronously by the sync orchestrator (Phase 7)

#### Student Booking Form

- Pre-filled with the selected slot's faculty name, date, time
- Title input (required)
- Description textarea (optional)
- Faculty multi-select dropdown (fetched from `/api/auth/users`)
- On submit → `POST /api/appointments` with extended payload

#### Faculty View of Additional Attendees

- Faculty dashboard shows all attendees on the appointment card
- `AppointmentAttendee` status badges (INVITED / ACCEPTED / DECLINED)
- Attendee faculty can accept/decline via the booking ticket page

### New/Modified Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | + `title`, `description` on Appointment. + `AppointmentAttendee` model + `AttendeeStatus` enum |
| `lib/models/index.ts` | + `AttendeeStatus` type, update `Appointment`, + `AppointmentAttendee` types |
| `lib/repositories/interfaces.ts` | + attendee fields in `CreateAppointmentInput`, + `IAppointmentAttendeeRepository` |
| `lib/repositories/prisma.ts` | + attendee repository methods |
| `lib/repositories/factory.ts` | + export attendee repo |
| `lib/controllers/appointments.ts` | Update `requestAppointment()` to accept title/description/attendeeIds |
| `app/api/appointments/route.ts` | Update POST handler to pass new fields |
| `components/BookingCalendar.tsx` | Update slot click to open form instead of direct booking |
| `components/BookingForm.tsx` | New — modal/form for title, description, faculty attendees |
| `app/student/page.tsx` | Wire up new booking flow |
