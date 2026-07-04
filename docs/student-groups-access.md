# Student Access Groups — Seed Reference

These four groups organize the STUDENT role's pages and API endpoints for the
access config UI (`/admin/access-config/STUDENT`). They should replace/supersede the
generic "Student" catalog category when displaying STUDENT group config.

---

## 1. Dashboard

| Field | Value |
|---|---|
| **Label** | Dashboard |
| **Page path** | `/student` |
| **API endpoints** | `/api/auth/onboarding` |

---

## 2. Consultations

| Field | Value |
|---|---|
| **Label** | Consultations |
| **Page paths** | `/student/book`, `/student/meetings`, `/student/meetings/[id]` |
| **API endpoints** | `/api/appointments/batch`, `/api/appointments/faculty-booked`, `/api/appointments/[id]`, `/api/appointments/[id]/student-cancel`, `/api/users/primary`, `/api/users/attendees`, `/api/availability-rules` |

Notes:
- `/api/appointments` prefix covers all appointment sub-paths.
- `/student/meetings/[id]` is a dynamic route — its page component (`[id]/page.tsx`)
  renders `AppointmentDetail` which calls appointment APIs.

---

## 3. Timeline

| Field | Value |
|---|---|
| **Label** | Timeline |
| **Page path** | *(embedded in Dashboard — no standalone page)* |
| **API endpoints** | *(none — rendered via Server Component, data fetched directly from services)* |

Notes:
- Rendered inside `StudentDashboard.tsx` → `ConsultationsTimeline` component.
- Data comes from `listStudentAppointments()` service call on the server.
- If a standalone page is created later, this entry should be updated with its path.

---

## 4. My Evaluation(s)

| Field | Value |
|---|---|
| **Label** | My Evaluation(s) |
| **Page paths** | `/student/evaluations`, `/student/evaluations/[id]`, `/student/evaluations/history`, `/evaluate/[id]` |
| **API endpoints** | `/api/evaluation-periods`, `/api/evaluation-periods/[id]/rubric`, `/api/evaluations`, `/api/evaluations/pending`, `/api/evaluations/[id]`, `/api/evaluations/[id]/ratings`, `/api/evaluations/[id]/comments`, `/api/evaluations/[id]/submit`, `/api/evaluations/dispute` |

Notes:
- `/api/evaluation-periods` and `/api/evaluations` prefixes cover all sub-paths.
- The evaluation form at `/evaluate/[id]` is a shared page (not under `/student/`)
  but is functionally part of this group.

---

## Implementation Notes

- All API endpoints listed above are already hard-coded in `lib/access.ts` at
  `STUDENT_API_PATHS` for the proxy middleware.
- The access config UI currently groups pages by URL prefix via `pageCategory()`
  in `app/api/admin/access-config/route.ts`. For STUDENT, all pages fall under
  the "Student" category. To display these functional groups instead, either:
  1. Add a `group_label` or `subcategory` field to `group_access` table, or
  2. Override the catalog display in `[groupName]/page.tsx` when `groupName === "STUDENT"` using a lookup map.
- The seed migration should populate (or update) the `group_access` row for
  STUDENT with `pages` containing the listed page paths, and `api_overrides` if
  any API overrides are needed.
