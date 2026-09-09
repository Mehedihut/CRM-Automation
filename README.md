# CRM-Automation

Production-ready CRM foundation for managing Meta/Facebook leads, team
assignment, call outcomes, WhatsApp communication, follow-ups, and Puku
access-request tracking — with management dashboards and statistics.

This repository currently contains **only the foundation**:

- Clean full-stack architecture (React + TypeScript frontend, Node.js +
  Express + TypeScript backend).
- PostgreSQL via Prisma ORM.
- REST APIs with a central error envelope and Zod-backed validation.
- Health-check endpoint (`GET /api/health`) with graceful handling of a
  missing PostgreSQL configuration.
- Environment-variable based secrets (`.env.example` only — no real
  credentials are committed).

Business features (authentication, RBAC, lead ingestion, team assignment,
call classification, WhatsApp tracking, follow-ups, Puku access requests,
dashboards) are intentionally **not** implemented yet.

---

## Repository layout

```
CRM-Automation/
├── client/                 # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI (e.g. HealthBadge)
│   │   ├── pages/          # Route-level pages (DashboardPage placeholder)
│   │   ├── services/       # API client (typed fetch wrapper)
│   │   ├── types/          # Shared API types
│   │   ├── config.ts       # Runtime config (reads VITE_API_BASE_URL)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── server/                 # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── config/         # env loader, Prisma client factory
│   │   ├── controllers/    # HTTP handlers
│   │   ├── routes/         # Express routers (mounted under /api)
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # error handler, Zod validator
│   │   ├── utils/          # ApiError, logger, asyncHandler
│   │   ├── app.ts          # createApp() factory
│   │   └── server.ts       # process bootstrap + graceful shutdown
│   ├── prisma/
│   │   └── schema.prisma   # PostgreSQL datasource (minimal for now)
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── .gitignore
├── .env.example            # top-level example for shared vars
└── README.md
```

---

## Tech stack

| Layer    | Choice                                  |
| -------- | --------------------------------------- |
| Frontend | React 18, TypeScript, Vite              |
| Backend  | Node.js 18+, Express 4, TypeScript      |
| ORM      | Prisma 5                                |
| DB       | PostgreSQL                              |
| API      | REST (`/api/*`)                         |
| Security | helmet, CORS allow-list, env-based cfg  |
| Validation | Zod (server), typed responses (client) |

---

## Prerequisites

- Node.js **>= 18.18** (tested with Node 24)
- npm 10+ (or pnpm/yarn — commands below use `npm`)
- PostgreSQL **only when you're ready to use a real database**. The server
  starts and serves `/api/health` without one.

---

## Quick start

### 1) Install dependencies

From the repo root:

```bash
npm --prefix server  install
npm --prefix client  install
```

### 2) Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env and set DATABASE_URL to your PostgreSQL connection string.
# Example:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_automation?schema=public

# Client (optional — defaults to http://localhost:4000)
cp client/.env.example client/.env
```

> **Never commit real credentials.** Only `.env.example` files are tracked.

### 3) Run the apps

In two terminals:

```bash
# Terminal 1 — backend (http://localhost:4000)
npm --prefix server run dev

# Terminal 2 — frontend (http://localhost:5173)
npm --prefix client run dev
```

### 4) Verify

```bash
# Backend health (also works without a configured DB)
curl http://localhost:4000/api/health

# Open the frontend
# http://localhost:5173
```

---

## API

All API responses use a consistent envelope:

```jsonc
// success
{ "success": true,  "data": { ... } }

// error
{ "success": false, "error": { "code": "BAD_REQUEST", "message": "...", "details": {} } }
```

| Method | Path           | Purpose                          |
| ------ | -------------- | -------------------------------- |
| GET    | `/api/health`  | Liveness + DB readiness probe    |
| GET    | `/`            | Friendly root banner             |

Future routes (placeholders in `server/src/routes/index.ts`):

- `/api/auth` — authentication
- `/api/leads` — lead ingestion & management
- `/api/team` — team members & assignment
- `/api/whatsapp` — WhatsApp activity tracking
- `/api/follow-ups` — interested-lead follow-ups
- `/api/puku-access` — Puku access-request workflow
- `/api/dashboard` — statistics for management

---

## Scripts

### Server (`server/`)

| Command                       | What it does                                |
| ----------------------------- | ------------------------------------------- |
| `npm run dev`                 | Run with `ts-node-dev` (auto-reload)        |
| `npm run build`               | Compile TypeScript to `dist/`               |
| `npm start`                   | Run the compiled server                     |
| `npm run typecheck`           | TypeScript-only check                       |
| `npm run prisma:generate`     | Generate Prisma client                      |
| `npm run prisma:migrate`      | Run dev migrations against `DATABASE_URL`   |
| `npm run prisma:studio`       | Open Prisma Studio                          |

### Client (`client/`)

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Vite dev server on port 5173          |
| `npm run build`     | Type-check + production build         |
| `npm run preview`   | Preview the production build          |
| `npm run typecheck` | TypeScript-only check                 |

---

## What this step intentionally does NOT include

- No Meta/Facebook Ads, WhatsApp Business, or Puku API integrations.
- No authentication or RBAC.
- No domain models beyond an empty Prisma schema.
- No business dashboard, no seed/fake data.
- No SQLite, no JSON-file database.

These will be added in subsequent, separately-scoped steps.

---

## Deploy to Vercel

The server ships with a serverless entry (`server/api/index.ts`) and
`server/vercel.json` ready for one-click deploy. The client ships with
`client/vercel.json` that handles SPA rewrites.

The two projects are deployed **separately** because they live in
different sub-directories of the repo.

### Server (API)

1. Vercel → **Add New…** → **Project** → import this repo.
2. **Root Directory**: `server`.
3. **Framework Preset**: leave as "Other" (Vercel auto-detects
   `@vercel/node` from `vercel.json`).
4. Add the environment variables below.
5. Deploy.

#### Required env vars (server)

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string — Neon, Supabase, or Vercel Postgres all work. The server refuses to boot without it when `NODE_ENV=production`. |
| `JWT_SECRET` | Strong random string (`openssl rand -hex 32`). Boot will fail loudly if this is left as the dev fallback. |
| `COOKIE_DOMAIN` | Set to `.your-domain.com` (leading dot) for cross-subdomain cookies, or leave blank. |
| `CLIENT_ORIGIN` | The deployed client URL — comma-separate multiple if you have a preview + prod. Used by CORS. |
| `APP_BASE_URL` | Public base URL used to build password-reset links. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `SMTP_FROM` | All required for forgot-password emails to be sent. When any is missing, the reset link is logged to the server console (dev only — set all of them in production). |

`NODE_ENV=production` is set automatically by `vercel.json`.

#### Database migrations

Vercel does **not** run `prisma migrate` on deploy. From your laptop,
with `DATABASE_URL` pointed at the production database:

```bash
npm --prefix server run prisma:generate
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

(Or use the Vercel CLI's `vercel env pull` to grab prod env into a
local `.env` for that one-off migration run.)

#### Verify

```bash
curl https://<your-api>.vercel.app/api/healthz
# → { "success": true, "data": { "status": "ok", "db": "ok" } }
```

### Client (SPA)

1. Vercel → **Add New…** → **Project** → import this repo (same one).
2. **Root Directory**: `client`.
3. **Framework Preset**: Vite.
4. Add environment variable:
   - `VITE_API_BASE_URL` = the deployed server URL (e.g.
     `https://<your-api>.vercel.app`). No trailing slash.
5. Deploy.

`client/vercel.json` ships a single rewrite that sends all paths to
`/index.html`, so React Router works on hard reloads and direct links.

### Local sanity check before deploying

```bash
npm --prefix server  run typecheck
npm --prefix client  run typecheck
npm --prefix client  run build      # Vite build (also typechecks)
```

All three should exit 0. Then push and let Vercel do the rest.

---

## License

Internal — not yet licensed for public distribution.
