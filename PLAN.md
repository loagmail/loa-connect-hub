# Faculty Workflow — Review & Plan

## Overview

Two separate meeting systems exist:

| System | Table | Audience | Created Via | Status Flow |
|---|---|---|---|---|
| **Appointments** | `appointments` + `appointment_attendees` + `appointment_time_slots` | Students ↔ Faculty (consultations) or Faculty ↔ Faculty (internal) | `/api/appointments` or `/api/appointments/batch` | PENDING → APPROVED / REJECTED / COMPLETED / CANCELLED |
| **Internal Meetings** | `internal_meetings` + `internal_meeting_participants` | Faculty ↔ Faculty only | `/api/meetings` | CONFIRMED / CANCELLED |

---

## Faculty Pages

### 1. Dashboard (`/faculty`)
- **Server component** — fetches all appointments via `listFacultyAppointments(facultyId)`
- **Metric cards**: Total, Pending, Completed (in-memory computed)
- **Upcoming Section**: `date >= today` + `APPROVED` or `PENDING`
- **Requests Section**: Tab-filtered (All/Pending/Accepted/Completed/Cancelled) via `<FacultyAppointmentTabs>`
- Each item is an `<AppointmentCard>` with Accept/Decline/Mark Complete/Cancel actions
- Link to `/faculty/availability` for configuring availability rules

### 2. Appointment Detail (`/appointments/[id]`)
- Accessed via "View Details" link from dashboard or appointment card
- Shows full appointment data with the same action buttons

### 3. Internal Meetings (`/faculty/meetings`)
- Separate system — uses `internal_meetings` table, not `appointments`
- List with filter pills: All / This Week / This Month / Created by Me / Declined
- Create form (`/faculty/meetings/new`) with "From Appointment" time-slot borrowing
- Detail page (`/faculty/meetings/[id]`) with Accept/Decline for participants, Cancel for organizer

### 4. Availability (`/faculty/availability`)
- Per-day-of-week rules with date-range scoping
- Weekdays default `08:00–18:00` unblocked, weekends default blocked
- Optimistic saves via `POST /api/availability-rules`

---

## API Actions

| Action | Endpoint | Controller | Effect |
|---|---|---|---|
| Accept | `POST /api/appointments/[id]/accept` | `acceptAppointment()` | Sets APPROVED + fires .ics email |
| Decline | `POST /api/appointments/[id]/decline` | `declineAppointment()` | Sets REJECTED |
| Complete | `POST /api/appointments/[id]/complete` | `completeAppointment()` | Sets COMPLETED |
| Cancel | `POST /api/appointments/[id]/cancel` | `cancelAppointment()` | Creator or faculty can cancel |
| Teams Link | `POST /api/appointments/[id]/teams-link` | `updateTeamsLink()` | Saves Teams meeting URL |
| Retry Sync | `POST /api/appointments/[id]/retry-sync` | `retryTeamsSync()` | Resets sync for Teams |

---

## Key Observations

1. **Two separate systems do not interoperate** — appointments don't appear in `/faculty/meetings`, internal meetings don't appear on the dashboard.
2. **No notification/acknowledgment** — new requests just appear in the filtered list. No unread badge or toast.
3. **Availability only affects student bookings** — noted on the availability page.
4. **Optimistic updates** — `AppointmentCard` uses local state for instant UI feedback, shows 3-second error on failure.
5. **Fire-and-forget email** — `acceptAppointment` sends `.ics` calendar email but swallows failures.

---

## Data Model (appointments table)

```
appointments
├── id, studentId, facultyId, createdByEmail
├── meetingType: CONSULTATION | INTERNAL
├── date, startTime, endTime
├── sessionGroupId (links batch bookings)
├── title, description
├── status: PENDING | APPROVED | REJECTED | COMPLETED | CANCELLED
├── teamsLink, teamsSyncStatus, teamsSyncRetries, teamsSyncError, teamsSyncLastAttempt
├── requestedAt, updatedAt
├── actionTaken, additionalRemarks
└── (joined via query: student, faculty, attendees)

appointment_attendees
├── id, appointmentId, userId
├── status: INVITED | ACCEPTED | DECLINED
└── isMandatory

appointment_time_slots
├── id, appointmentId
├── date, startTime, endTime
└── createdAt
```
