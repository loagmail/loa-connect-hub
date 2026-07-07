# Reports Feature — Current State

## ADMIN

| Report | Route | Type | Filterable By |
|--------|-------|------|---------------|
| Department Health (General) | `/admin/reports/health` | Consultation | department, date range, status |
| Faculty Response Monitor (Backlog) | `/admin/reports/backlog` | Consultation | department, date range, status |
| Consultation Reach (Coverage) | `/admin/reports/coverage` | Consultation | department, date range, status |
| Consultation Demand Trend | `/admin/reports/demand` | Consultation | department, date range, status, granularity |
| Faculty Consultation Distribution | `/admin/reports/distribution` | Consultation | department, date range, status |
| Responsiveness (TAT) | `/admin/reports/responsiveness` | **redirects to health** — component exists but unrouted | — |
| Evaluation Results | `/admin/evaluations/results` | Evaluation | department, period, per-subject toggle, source |
| Evaluation Reports Hub | `/admin/evaluations/reports` | Evaluation | links to sentiment |
| Sentiment Analysis | `/admin/evaluations/reports/sentiment` | Evaluation | sentiment label, period |

## DEAN

| Report | Route | Type | Filterable By |
|--------|-------|------|---------------|
| Department Health (General) | `/dean/reports/health` | Consultation | date range, status *(locked to own department)* |
| Faculty Response Monitor (Backlog) | `/dean/reports/backlog` | Consultation | date range, status *(locked to own department)* |
| Consultation Reach (Coverage) | `/dean/reports/coverage` | Consultation | date range, status *(locked to own department)* |
| Consultation Demand Trend | `/dean/reports/demand` | Consultation | date range, status, granularity *(locked to own department)* |
| Faculty Consultation Distribution | `/dean/reports/distribution` | Consultation | date range, status *(locked to own department)* |
| Responsiveness (TAT) | `/dean/reports/responsiveness` | **redirects to health** | — |
| Evaluation Results | `/dean/evaluations/results` | Evaluation | period *(department-filtered by API)* |
| Evaluation Reports Hub | `/dean/evaluations/reports` | Evaluation | links to sentiment |
| Sentiment Analysis | `/dean/evaluations/reports/sentiment` | Evaluation | sentiment label, period |

## FACULTY

| Report | Route | Type | Filterable By |
|--------|-------|------|---------------|
| Consultation Reports | `/faculty/reports` | **redirects to `/admin/reports/health` (broken)** | — |
| Evaluation Results (own) | `/faculty/evaluations/results` | Evaluation | period *(visibility-gated by admin toggle)* |

## Gaps vs Requirements

| Requirement | Status |
|-------------|--------|
| **ADMIN:** Filterable report of evaluation results per department and per faculty | ✅ Exists at `/admin/evaluations/results` — department filter + per-subject toggle |
| **ADMIN:** Filterable report of consultations per department and per faculty | ✅ Exists — 5 consultation report types, all filterable by department |
| **DEAN:** Filtered report on department level for evaluations and faculty | ✅ Exists at `/dean/evaluations/results` — locked to own department |
| **DEAN:** Filtered report on department level for consultations and per faculty | ✅ Exists — same 5 report types, locked to dean's department (no department dropdown) |
| **FACULTY:** Individual report for evaluations (toggled by admin) | ✅ Partial — evaluation results page exists with visibility gating; "toggled by admin" is implemented via `setVisibility()` |
| **FACULTY:** Individual report for consultations | ❌ **Missing** — `/faculty/reports` redirects to admin (broken) |

## Architecture Notes

- **Consultation reports** are server-side rendered (async server components → controller → service → repository → Supabase). No REST endpoints.
- **Evaluation results** are client-side fetched via REST API endpoints (`/api/{role}/evaluation-results`).
- **Dean is role-locked** to own department via `resolveReportDepartment()` in `report-helpers.ts`.
- **Responsiveness report** component (`ResponsivenessReport.tsx`) is fully built but routes redirect to health.
- **Faculty consultation reports** have no implementation — the page is a placeholder redirect.
