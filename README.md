# CRM-Automation

A production-ready CRM for managing leads, team assignments, call outcomes, WhatsApp communication, follow-ups, course-interest tracking, and Puku access requests — with role-based dashboards, light/dark theme, and end-to-end TypeScript.

## Features

- **Lead management** — create, edit, assign, and search leads with a six-stage status pipeline (`NEW` → `CONTACTED` → `INTERESTED` → `FOLLOW_UP` → `CONVERTED` / `LOST`).
- **Calls & WhatsApp** — log every interaction with outcomes, duration, notes, and timestamps. Per-lead tabs surface full history.
- **Follow-ups** — global queue with `PENDING` / `DONE` / `CANCELLED` statuses; from any lead detail view.
- **Course-interest tracking** — attach one or more courses a customer is interested in directly from the call log (especially when outcome is `INTERESTED`), or manage from a dedicated tab on the lead. Admins manage the course catalog; the dashboard reports interest at the course level.
- **Puku access requests** — agents request access on behalf of leads; admins approve or reject.
- **Role-based access** — admins see everything; agents only see their own assigned leads plus unassigned ones. Authorization is enforced server-side.
- **Dashboard** — totals, status breakdown, recent activity, per-agent performance, and **course-wise interest reporting** (interested leads, open follow-ups, converted per course).
- **Light / Dark / System theme** — every page supports a theme switcher in the top nav. Choice persists across reloads.
- **Mobile-friendly** — responsive layout, accessible tap targets, phone-reachable on the LAN.

## Quick Start

The project ships with **two run modes**:

| Mode | When to use | Database | Files |
|------|-------------|----------|-------|
| **SQLite (recommended for dev)** | No Docker installed, or you just want to start | `server/prisma/dev.db` (file) | `server/prisma/schema.prisma`, `server/prisma/seed.ts` |
| **Docker (production-style)** | Full Postgres + Adminer stack | `postgres:16-alpine` | `server/prisma/schema.postgres.prisma`, `server/prisma/seed.postgres.ts`, `docker-compose.yml`, `DOCKER.md` |

### Option A — SQLite dev mode (no Docker)

```bash
# 1. Backend
cd server
cp .env.example .env       # DATABASE_URL defaults to file:./dev.db
npm install
npx prisma db push          # apply schema to dev.db (no migrations needed locally)
npm run seed                # 4 courses, 10 leads, 15 calls, 10 whatsapp, 8 follow-ups, 3 puku requests
npm run dev                 # → http://localhost:4000

# 2. Frontend (new terminal)
cd ../client
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:4000
npm install
npm run dev                 # → http://localhost:5173
```

Open **http://localhost:5173** and sign in. Done.

### Option B — Docker (Postgres + Adminer + server + Nginx)

See **[DOCKER.md](./DOCKER.md)** for the full runbook. Quick version:

```bash
# Swap the schema and seed files
copy server\prisma\schema.prisma server\prisma\schema.sqlite.prisma
copy server\prisma\seed.ts       server\prisma\seed.sqlite.ts
copy server\prisma\schema.postgres.prisma server\prisma\schema.prisma
copy server\prisma\seed.postgres.ts       server\prisma\seed.ts

docker compose up -d --build   # → http://localhost:8080
```

## Demo Credentials

| Role  | Email                | Password   |
|-------|----------------------|------------|
| Admin | `admin@crm.local`    | `admin123` |
| Agent | `agent1@crm.local`   | `agent123` |
| Agent | `agent2@crm.local`   | `agent123` |

- **Admin** — full access: create/edit/delete leads, manage team, manage courses, approve/reject Puku access.
- **Agent** — see only assigned + unassigned leads, log calls/WhatsApp/follow-ups, attach course interests, request Puku access.

## Tech Stack

| Layer    | Choice                                                  |
|----------|---------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite 5                            |
| Backend  | Node.js 18+, Express 4, TypeScript                      |
| ORM      | Prisma 5                                                |
| Database | SQLite (dev) / PostgreSQL 16 (Docker)                   |
| Auth     | JWT in httpOnly cookie                                  |
| Forms    | react-hook-form + Zod (shared schemas client/server)    |
| Data     | @tanstack/react-query                                   |
| State    | Zustand (auth + theme, both persisted)                  |

## Project Structure

```
CRM-Automation/
├── client/                # React + TypeScript + Vite
│   └── src/
│       ├── components/    # Layout, ProtectedRoute, RoleGate, DataTable, Modal,
│       │                  # FormField, MultiSelect, ThemeSelector, StatusBadge, …
│       ├── hooks/         # useAuth, useLeads, useCalls, useCourses, useFollowUps, …
│       ├── lib/           # api wrapper, auth store, theme store, queryClient
│       ├── pages/         # Login, Dashboard, LeadsList, LeadDetail, CoursesPage, …
│       ├── schemas/       # Zod schemas shared with server (per feature)
│       ├── services/      # typed fetch wrappers per feature
│       └── types/         # envelope + domain types
├── server/                # Express + Prisma
│   └── src/
│       ├── modules/       # auth, leads, team, calls, whatsapp, followUps,
│       │                  # pukuAccess, dashboard, courses, leadCourseInterests
│       ├── middleware/    # requireAuth, requireRole, validate, errorHandler
│       ├── config/        # env, prisma client
│       ├── utils/         # ApiError, asyncHandler, logger, jwt
│       ├── routes/        # mounts every feature router under /api
│       └── app.ts / server.ts
├── prisma/                # schema.prisma + seed.ts (SQLite) and schema.postgres.prisma (Postgres mirror)
├── docker-compose.yml     # Postgres + Adminer + server + client (Nginx)
├── DOCKER.md              # Docker runbook
├── PROGRESS.md            # Session-by-session changelog
└── README.md              # ← you are here
```

## Available API Routes

### Auth & health
| Method | Path                  | Auth   | Description                                  |
|--------|-----------------------|--------|----------------------------------------------|
| GET    | `/api/health`         | —      | Liveness + DB readiness                      |
| POST   | `/api/auth/login`     | —      | Login (sets `auth_token` httpOnly cookie)    |
| POST   | `/api/auth/logout`    | —      | Clears cookie                                |
| GET    | `/api/auth/me`        | user   | Current user                                 |

### Leads
| Method | Path                          | Auth  | Description                              |
|--------|-------------------------------|-------|------------------------------------------|
| GET    | `/api/leads`                  | user  | List (filterable: `status`, `assignedToId`, `search`, `courseId`, `page`, `pageSize`) |
| POST   | `/api/leads`                  | admin | Create                                   |
| PATCH  | `/api/leads/:id`              | admin | Update                                   |
| PATCH  | `/api/leads/:id/assign`       | admin | Assign to agent                          |
| DELETE | `/api/leads/:id`              | admin | Hard delete                              |
| GET    | `/api/leads/:id`              | user  | Detail (includes `courseInterests`)      |

### Calls, WhatsApp, Follow-ups, Puku
| Method | Path                                | Auth  | Description                  |
|--------|-------------------------------------|-------|------------------------------|
| GET    | `/api/leads/:leadId/calls`          | user  | List calls                   |
| POST   | `/api/leads/:leadId/calls`          | user  | Log call (supports `INTERESTED` + `courseIds`) |
| DELETE | `/api/calls/:id`                    | user  | Delete call                  |
| GET    | `/api/leads/:leadId/whatsapp`       | user  | List WhatsApp messages       |
| POST   | `/api/leads/:leadId/whatsapp`       | user  | Log message                  |
| DELETE | `/api/whatsapp/:id`                 | user  | Delete message               |
| GET    | `/api/follow-ups`                   | user  | Global list (scoped by role) |
| POST   | `/api/leads/:leadId/follow-ups`     | user  | Schedule follow-up           |
| PATCH  | `/api/follow-ups/:id`               | user  | Update status / reschedule   |
| DELETE | `/api/follow-ups/:id`               | user  | Delete                       |
| GET    | `/api/puku-access`                  | user  | List requests                |
| POST   | `/api/leads/:leadId/puku-access`    | user  | Create request               |
| PATCH  | `/api/puku-access/:id`              | admin | Approve / reject             |

### Course Interest (new)
| Method | Path                                          | Auth  | Description                                  |
|--------|-----------------------------------------------|-------|----------------------------------------------|
| GET    | `/api/courses`                                | user  | List active courses (admins can pass `?includeInactive=true`) |
| GET    | `/api/courses/:id`                            | user  | Get one                                      |
| POST   | `/api/courses`                                | admin | Create a course                              |
| PATCH  | `/api/courses/:id`                            | admin | Update name/description/active               |
| DELETE | `/api/courses/:id`                            | admin | Soft-delete (sets `isActive=false`)          |
| GET    | `/api/leads/:leadId/course-interests`         | user  | List a lead's course interests (scoped)      |
| PUT    | `/api/leads/:leadId/course-interests`         | user  | Replace a lead's course interest set (scoped)|

### Team & dashboard
| Method | Path                       | Auth  | Description                                  |
|--------|----------------------------|-------|----------------------------------------------|
| GET    | `/api/team`                | admin | List team members                            |
| GET    | `/api/team/agents`         | user  | Active agents (assignment UI)                |
| POST   | `/api/team`                | admin | Create member                                |
| PATCH  | `/api/team/:id`            | admin | Update member                                |
| DELETE | `/api/team/:id`            | admin | Soft-delete member                           |
| GET    | `/api/dashboard/stats`     | user  | Aggregated stats (now includes `courseInterest` array) |

## API Conventions

All endpoints return a uniform envelope:

```jsonc
// success
{ "success": true,  "data": <T> }

// error
{ "success": false, "error": { "code": "BAD_REQUEST", "message": "...", "details": <any> } }
```

Auth is performed via the `auth_token` httpOnly cookie (set by `/api/auth/login`) or `Authorization: Bearer <token>`.

## UI Walk-through

After signing in:

1. **Dashboard** — totals, status breakdown, recent activity, per-agent performance, and a new **Course interest** card showing interested/follow-up/converted counts per course. Click any "Interested leads" count to drill into `/leads?courseId=…`.
2. **Leads** — searchable, filterable by status and course. Each row shows up to 3 course-interest chips. Use the **All courses** filter to scope the table.
3. **Lead → New Lead** — admin-only; status defaults to `NEW`.
4. **Lead detail** — six tabs:
   - **Info** — contact, assignment, notes.
   - **Courses** — read-only chips for current interests + "Manage interests" modal with a searchable multi-select.
   - **Calls** — full history with outcome, agent, duration, notes. The log-call form includes a **"Next interested course"** searchable multi-select; it surfaces a hint when outcome is `INTERESTED`.
   - **WhatsApp / Follow-ups / Puku Access** — same as before.
5. **Courses** (admin only) — manage the catalog: create, edit name/description, activate/deactivate, delete (soft). Deactivated courses stop appearing as new selections in call forms, but historical lead interests are preserved.
6. **Team** (admin) — CRUD team members.
7. **Follow-ups** — global queue.
8. **Puku Access** (admin) — approve/reject queue.
9. **Theme switcher** — top-right of the nav: ☀ Light · 🌙 Dark · ⌨ System.

## Course-Interest Feature (Detailed)

### Data model

```
Course (id, name UNIQUE, description?, isActive, createdAt, updatedAt)
  └──< LeadCourseInterest (leadId, courseId, createdAt, updatedAt)
         @@unique([leadId, courseId])

Lead (…existing fields…)
  └──< courseInterests: LeadCourseInterest[]
```

Both schema files (`schema.prisma` for SQLite, `schema.postgres.prisma` for Postgres) are kept in lockstep.

### Behavior

- When an agent logs a call with `outcome: "INTERESTED"` and selects one or more courses, those courses are persisted as `LeadCourseInterest` rows **in the same transaction as the call**. Any previous interests for that lead are replaced (delete + insert), so the latest call's "next interested course" is always the source of truth.
- For any other outcome, `courseIds` is silently dropped — the dashboard's "course interest" signal stays aligned with the explicit `INTERESTED` outcome.
- Agents can also attach/detach courses at any time from the lead detail's **Courses** tab without logging a call.
- Authorization: only admins or the assigned agent can edit a lead's interests; otherwise the API returns `403 FORBIDDEN`.

### Reporting

The dashboard endpoint returns a `courseInterest` array:
```json
{
  "courseId": "…",
  "courseName": "AI Engineering Career Track",
  "isActive": true,
  "interested": 4,
  "followUps": 3,
  "converted": 0
}
```

The UI renders this as a sortable-looking table; each `interested` count is a link to `/leads?courseId=…` (the leads page reads that query param and auto-applies the filter).

## Theme Switcher (Detailed)

- **Three options**: Light, Dark, System.
- **Persistence**: the choice is saved in `localStorage` under the key `crm-theme` via Zustand's `persist` middleware.
- **No FOUC**: a small inline `<script>` in `index.html` reads the persisted value **before React mounts** and sets `document.documentElement.dataset.theme`, so the page renders in the correct theme on the very first paint.
- **System mode** live-tracks the OS preference via `matchMedia("(prefers-color-scheme: dark)")` — change your OS theme and the app follows instantly.
- **Implementation**: every neutral color in `client/src/styles.css` is a CSS custom property (`--bg`, `--text`, `--card-bg`, `--border`, `--nav-bg`, `--input-bg`, `--hover-bg`, `--chip-*`, `--modal-overlay`, `--shadow-*`). A `:root[data-theme="dark"]` block redefines them. **Status badges (NEW / INTERESTED / CONVERTED / etc.) keep their original colors in both themes** because they're semantic signal, not chrome.
- **Native form controls** (scrollbars, date pickers) follow the theme via `color-scheme: dark|light`.

## Development Scripts

```bash
# Server (cd server)
npm run dev             # Express on :4000 with auto-reload (ts-node-dev)
npm run build           # tsc → dist/
npm run start           # node dist/server.js
npm run typecheck       # tsc --noEmit
npm run prisma:studio   # visual DB explorer
npm run seed            # re-seed dev data (idempotent)

# Client (cd client)
npm run dev             # Vite dev server on :5173
npm run build           # production bundle (dist/)
npm run typecheck       # tsc --noEmit
```

## Environment Variables

`server/.env` (copy from `.env.example`):

| Var             | Example                                                   | Notes                                         |
|-----------------|-----------------------------------------------------------|-----------------------------------------------|
| `NODE_ENV`      | `development`                                             |                                               |
| `PORT`          | `4000`                                                    |                                               |
| `CLIENT_ORIGIN` | `http://localhost:5173,http://192.168.0.1:5173`           | Comma-separate for multiple origins (LAN, etc.) |
| `DATABASE_URL`  | `file:./dev.db` (SQLite) or `postgresql://crm:crm@…/crm`  |                                               |
| `JWT_SECRET`    | (random 32+ char string)                                  | **Change in production**                      |

`client/.env`:

| Var                 | Example                       |
|---------------------|-------------------------------|
| `VITE_API_BASE_URL` | `http://localhost:4000`       |

## Manual Verification (Quick Checklist)

```bash
# Health
curl http://localhost:4000/api/health

# Login (saves cookie)
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@crm.local","password":"admin123"}'

# List courses
curl -b cookies.txt http://localhost:4000/api/courses

# Log an INTERESTED call with two courses
LEAD=…; AI=…; SYS=…   # grab IDs from the list endpoints
curl -b cookies.txt -X POST "http://localhost:4000/api/leads/${LEAD}/calls" \
  -H 'Content-Type: application/json' \
  -d "{\"outcome\":\"INTERESTED\",\"notes\":\"Wants next batch\",\"courseIds\":[\"${AI}\",\"${SYS}\"]}"

# Confirm interests
curl -b cookies.txt "http://localhost:4000/api/leads/${LEAD}/course-interests"

# Dashboard stats (includes courseInterest)
curl -b cookies.txt http://localhost:4000/api/dashboard/stats

# Filter leads by course
curl -b cookies.txt "http://localhost:4000/api/leads?courseId=${AI}"
```

UI walk-through: open http://localhost:5173 and click through every screen.

## Out of Scope (Intentionally Deferred)

- Real Meta / Facebook lead-ads webhook integration.
- Real WhatsApp Business API integration (WhatsApp is manual logging only).
- Real telephony / CTI (calls are logged outcomes only).
- Password reset / email verification flows.
- File uploads / attachments.
- Refresh-token rotation, CSRF tokens (relies on `SameSite=Lax`).
- Automated tests, CI/CD.
- Bulk operations, search, CSV export, advanced reporting.
- Per-user dashboard scoping (currently shows the global view for all roles).
- Migration files (the dev workflow uses `prisma db push`; both schema files are the source of truth and stay in lockstep).

## License

Internal project — all rights reserved.
