# E-Consultation

Academic e-Consultation booking system built with Next.js 16.

- **Students** browse faculty availability and book consultation slots
- **Faculty** create availability, manage appointment requests, add Teams meeting links
- **Admin** overview of all users and appointments
- **Microsoft Teams** integration (feature-flagged) for automatic meeting creation via Graph API

## Tech Stack

- Next.js 16 (App Router)
- NextAuth.js v5 (Credentials + Microsoft Entra ID)
- Prisma 7 (SQLite local / PostgreSQL production)
- Tailwind CSS 4
- Vitest

## Getting Started

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Credentials

After running the seed script, the following users are available:

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Admin   | admin@econsult.com    | password123 |
| Faculty | faculty1@econsult.com | password123 |
| Faculty | faculty2@econsult.com | password123 |
| Student | student@econsult.com  | password123 |

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite (`file:./dev.db`) or PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth encryption secret (run `npx auth secret` to generate) |
| `FEATURE_CREATE_TEAMS_MEETING` | `true` or `false` — enables automatic Teams meeting creation |
| `MICROSOFT_CLIENT_ID` | Azure AD app registration client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure AD app registration client secret |
| `MICROSOFT_TENANT_ID` | Azure AD tenant ID |

## Architecture

```
lib/
  prisma.ts              — Prisma client singleton
  auth.ts                — NextAuth config (Credentials + Microsoft)
  models/index.ts        — Shared domain types
  repositories/
    interfaces.ts        — Repository interfaces
    prisma.ts            — Prisma implementations
    factory.ts           — Provider factory
  controllers/
    auth.ts              — Registration
    schedules.ts         — Schedule CRUD
    appointments.ts      — Booking lifecycle
    teamsMeeting.ts      — Teams meeting creation
  services/
    graph.ts             — Microsoft Graph API
middleware.ts            — Route protection
app/
  api/                   — REST API routes
  (auth)/                — Login / Register pages
  student/               — Student dashboard
  faculty/               — Faculty dashboard
  admin/                 — Admin dashboard
components/              — Shared UI components
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| GET/POST | `/api/auth/[...nextauth]` | No | NextAuth handlers |
| GET | `/api/schedules` | No | List available schedules |
| POST | `/api/schedules` | Faculty | Create availability |
| PATCH/DELETE | `/api/schedules/[id]` | Faculty | Update/delete schedule |
| GET | `/api/appointments` | Student/Faculty | List own appointments |
| POST | `/api/appointments` | Student | Request appointment |
| GET | `/api/appointments/[id]` | Auth | Get appointment details |
| POST | `/api/appointments/[id]/[action]` | Faculty | approve/reject/complete/teams-link |
| POST | `/api/teams-meeting/create` | Faculty | Create Teams meeting |

## Microsoft Teams Integration

This feature is controlled by `FEATURE_CREATE_TEAMS_MEETING`.

When **disabled** (default): Faculty manually enters a Teams meeting link on approved appointments.

When **enabled**: The app uses the faculty member's Microsoft Graph OAuth token to automatically create a Teams meeting during approval. Requires:

1. Azure AD app registration with `OnlineMeetings.ReadWrite` delegated permission
2. Faculty signed in with their Microsoft account via NextAuth

## Tests

```bash
npx vitest run
```

## License

MIT
