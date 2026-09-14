# RESUME — Pickup note for next session

> **Status snapshot saved on 2026-09-14.** Two big features added today and saved to a side branch on GitHub.

## TL;DR — Where we are right now

✅ **Two new features fully built, typechecked, and committed on a side branch:**

1. **Course-interest tracking** — admin-managed `Course` catalog + per-lead `LeadCourseInterest` join + new `INTERESTED` call outcome with course multi-select + dashboard course-wise reporting.
2. **Light/Dark/System theme switcher** — three-option segmented control in the nav, persisted to `localStorage`, no FOUC on reload, live OS-theme tracking.

🟢 **Code lives on branch `feature/course-interest-and-theme`** (commit `55259df`) — pushed to GitHub but **NOT merged into `main`** because the two branches diverged structurally. See "Why a side branch?" below.

🟢 **Local working tree is currently on `feature/course-interest-and-theme`** and ready to run:
```bash
cd "C:\Users\1\Desktop\Puku CRM\CRM-Automation"
cd server && npm run dev      # http://localhost:4000
cd ../client && npm run dev   # http://localhost:5173
```
Login: `admin@crm.local / admin123` · `agent1@crm.local / agent123` · `agent2@crm.local / agent123`

📜 **The richer narrative (per-feature design decisions, file map, curl smoke-tests) is in `PROGRESS.md`** at the repo root.

---

## What's new in this session

### 1. Course-interest tracking feature

**Schema** (SQLite + Postgres in lockstep — `server/prisma/schema.prisma` and `schema.postgres.prisma`):
- `Course { id, name UNIQUE, description?, isActive, createdAt, updatedAt }`
- `LeadCourseInterest { leadId, courseId, @@unique([leadId, courseId]) }`
- `Lead` gains `courseInterests LeadCourseInterest[]` relation.

**Backend** (new modules):
- `server/src/modules/courses/` — full CRUD with admin-only writes, soft-delete via `isActive=false`. Agents get active-only listing by default.
- `server/src/modules/leadCourseInterests/` — `GET` + `PUT` for a lead's interests, scoped by `assertLeadAccessible()` (mirrors the agent scoping rule from `leads.service.ts`).
- `server/src/modules/calls/calls.service.ts` — `logCall` now wraps in `$transaction`; when `outcome === "INTERESTED"`, course IDs are persisted as `LeadCourseInterest` rows in the same transaction (delete-then-create so the latest call is the source of truth). For any other outcome, `courseIds` is silently dropped.
- `server/src/modules/leads/leads.service.ts` — `listLeads` accepts `?courseId=` filter (`where.courseInterests = { some: { courseId } }`); all read paths now include `courseInterests` in the response.
- `server/src/modules/dashboard/dashboard.service.ts` — new `courseInterest: [{ courseId, courseName, isActive, interested, followUps, converted }]` aggregate computed in a single `prisma.course.findMany()` call.

**Backend** (extended):
- New endpoints:
  - `GET /api/courses` (any user; `?includeInactive=true` admin-only)
  - `POST /api/courses`, `PATCH /api/courses/:id`, `DELETE /api/courses/:id` (admin)
  - `GET /api/leads/:leadId/course-interests` (any user, scoped)
  - `PUT /api/leads/:leadId/course-interests` (any user, scoped)
- `CALL_OUTCOMES` now includes `"INTERESTED"`.
- `logCallSchema` accepts `courseIds: z.array(z.string()).max(50).optional().default([])`.

**Frontend** (new):
- `client/src/components/MultiSelect.tsx` — searchable multi-select with chip display, click-outside/Escape to close, disabled-option support, `showInactiveHint` prop. ~120 lines, no new dependencies.
- `client/src/components/CoursesPage.tsx` (admin only) — DataTable with search + Active-only toggle, create/edit modal, deactivate (soft delete).
- `client/src/hooks/useCourses.ts` — `useCourses`, `useActiveCourses`, `useCourse`, `useCreateCourse`, `useUpdateCourse`, `useDeleteCourse`.
- `client/src/services/courses.api.ts` — `list({ includeInactive }?)`, `get`, `create`, `update`, `remove`.
- `client/src/schemas/courses.schema.ts` — `courseFormSchema`, `setLeadInterestsSchema`, `cleanCoursePayload`.

**Frontend** (extended):
- `client/src/types/domain.ts` — `Course`, `LeadCourseInterest`, `courseInterests` on `Lead`, `courseInterest` on `DashboardStats`. `CallOutcome` includes `"INTERESTED"`.
- `client/src/schemas/calls.schema.ts` — `CALL_OUTCOMES` + `logCallSchema` accept `courseIds`.
- `client/src/services/leads.api.ts` — `list()` accepts `courseId`; `setCourseInterests(leadId, courseIds)`.
- `client/src/hooks/useLeads.ts` — `useSetLeadInterests(leadId)`.
- `client/src/pages/LeadDetailPage.tsx` — new **Courses** tab between Info and Calls with badge count; "Manage interests" modal pre-fills with active courses; the existing `LogCallForm` got a MultiSelect labeled "Next Interested Course" with a hint that highlights when `outcome === "INTERESTED"`.
- `client/src/pages/LeadsListPage.tsx` — course filter dropdown + Courses column with chips. Reads `?courseId=` from URL via `useSearchParams` so dashboard deep-links work.
- `client/src/pages/DashboardPage.tsx` — new **Course interest** card showing interested/follow-ups/converted counts per course. "Interested" counts link to `/leads?courseId=…`.
- `client/src/components/FormField.tsx` — added optional `hint` prop.
- `client/src/styles.css` — added `.multiselect*`, `.chip`, `.tab-count` rules; status badges keep their semantic colors.

**Seed** (`server/prisma/seed.ts`):
- 4 default courses: "AI Engineering Career Track", "System Design", "Mastering AWS & DevOps", "Other" — all `isActive: true`.
- 6 demo `LeadCourseInterest` rows so the dashboard has signal on first boot.
- `cleanup()` deletes `LeadCourseInterest` rows so re-seeding is idempotent.

### 2. Theme switcher feature

**Goal:** Light / Dark / System theme, persisted across reloads, no FOUC.

**Files:**
- `client/src/lib/theme.ts` — Zustand store with `theme: "light" | "dark" | "system"`, persisted under `localStorage["crm-theme"]` (Zustand `persist` middleware). Exports `applyTheme`, `resolveTheme`, `readPersistedTheme`, `watchSystemTheme` (live `matchMedia` listener for "System" mode).
- `client/src/components/ThemeSelector.tsx` — 3-button segmented control with `aria-pressed` for accessibility, mounted in `Layout.tsx`.
- `client/src/main.tsx` — calls `applyTheme()` and `watchSystemTheme()` on startup (HMR-disposable).
- `client/index.html` — inline pre-React `<script>` reads `localStorage["crm-theme"]` and sets `document.documentElement.dataset.theme` **before React mounts**, eliminating FOUC. Algorithm mirrors `lib/theme.ts:resolveTheme`.
- `client/src/styles.css` — full refactor: every neutral color is a CSS custom property (`--bg`, `--text`, `--card-bg`, `--border`, `--nav-bg`, `--input-bg`, `--hover-bg`, `--chip-*`, `--modal-overlay`, `--shadow-*`). `:root[data-theme="dark"]` redefines them. **Status badges keep their original colors in both themes** because they're semantic signal, not chrome.

**Native form controls** (scrollbars, date pickers) follow the theme via `color-scheme: dark|light`.

### 3. Tooling

- `docker-compose.yml` — Postgres 16 + Adminer (8081) + server (4000) + client (8080 via Nginx).
- `DOCKER.md` — full runbook.
- Per-service `Dockerfile` + `nginx.conf` + `.dockerignore`.
- `server/prisma/schema.postgres.prisma` + `seed.postgres.ts` — Postgres mirror (kept in lockstep with the SQLite schema).
- `.gitignore` extended to exclude `*.db` files (SQLite dev DB stays local).

### 4. README rewrite

`README.md` was completely rewritten to cover:
- Both run modes (SQLite dev / Docker Postgres) with a comparison table.
- Demo credentials, tech stack, project structure (including new directories).
- Full API routes tables including the new `/api/courses` and `/api/leads/:leadId/course-interests` endpoints.
- API conventions envelope.
- UI walk-through mentioning the new Courses tab.
- Detailed sections on the course-interest feature and theme switcher implementation.
- Dev scripts, env vars, manual verification curl examples.

---

## Why a side branch? (and what to do about it)

When I tried to merge `feature/course-interest-and-theme` into `main`, the merge produced **22 file conflicts** and the underlying divergences are structural, not cosmetic:

| | `main` (existing on GitHub) | `feature/course-interest-and-theme` (today) |
|---|---|---|
| **DB** | Postgres only (with native enums) | SQLite for dev + Postgres mirror |
| **IDs** | `Int @id @default(autoincrement())` | `String @id @default(cuid())` |
| **Module layout** | `server/src/services/` + `server/src/validators/` | `server/src/modules/<feature>/` (schema + service + controller + routes) |
| **Auth module** | `services/auth.tsx` + `RouteGuard` + `RequireAuth/RequireRole` | `hooks/useAuth.ts` + `lib/auth.ts` (Zustand) + `ProtectedRoute` + `RoleGate` |
| **Nav** | `TopNav` + `LeadsPage` (singular) | `Layout` (with `<Outlet/>`) + `LeadsListPage` |
| **Tests** | Vitest + CI + coverage thresholds | (none) |
| **Extras** | Audit log + Password reset + IP rate-limit + Vercel deploy guide | Course interest + Theme switcher |

To avoid shipping a broken half-merge, I left `main` untouched and pushed the new work to **`feature/course-interest-and-theme`**. The branch builds clean (server + client typechecks both pass).

**Recommended next steps when you resume:**

1. **Decide which side is the source of truth.** Two options:
   - **(a) Use `feature/course-interest-and-theme` as `main`** — port the audit log + password reset + Vitest + CI + new `main` schema (Int IDs, Postgres enums, AuditLog model, etc.) onto this branch's SQLite/cuid layout. Requires ~1 day of refactor but preserves the simpler dev experience.
   - **(b) Use the existing `main` as `main`** — re-implement course interest + theme switcher on top of the new Postgres/Int/Vitest structure. ~4 hours of work for the new features, plus adjusting the new schema to add `Course` + `LeadCourseInterest`, then writing tests. Cleaner long-term but loses the SQLite dev mode.

2. **Pick a deployment target** (the previous session also deferred this) — Vercel + Railway, Render full-stack, or Fly.io.

---

## How to resume locally

### Running the app

```bash
cd "C:\Users\1\Desktop\Puku CRM\CRM-Automation"

# Backend (SQLite dev mode, no Docker)
cd server
npm install            # if node_modules missing
npx prisma db push     # apply schema to dev.db
npx tsx prisma/seed.ts # idempotent: 4 courses + 10 leads + 15 calls + ...
npm run dev            # http://localhost:4000

# Frontend (new terminal)
cd ../client
npm install            # if node_modules missing
npm run dev            # http://localhost:5173
```

### Smoke-test the new features

```bash
# Health
curl http://localhost:4000/api/health

# Login (saves cookie)
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@crm.local","password":"admin123"}'

# List courses
curl -b cookies.txt http://localhost:4000/api/courses

# Pick a lead + two courses, then log an INTERESTED call with both
LEAD=...; AI=...; SYS=...
curl -b cookies.txt -X POST "http://localhost:4000/api/leads/${LEAD}/calls" \
  -H 'Content-Type: application/json' \
  -d "{\"outcome\":\"INTERESTED\",\"notes\":\"Wants next batch\",\"courseIds\":[\"${AI}\",\"${SYS}\"]}"

# Confirm interests
curl -b cookies.txt "http://localhost:4000/api/leads/${LEAD}/course-interests"

# Dashboard now includes courseInterest
curl -b cookies.txt http://localhost:4000/api/dashboard/stats

# Leads filter by course
curl -b cookies.txt "http://localhost:4000/api/leads?courseId=${AI}"
```

UI walk-through:
1. Sign in as admin → Dashboard now shows the **Course interest** card.
2. `/courses` (admin nav link) → create/edit/deactivate courses.
3. Open any lead → **Courses** tab → "Manage interests" → multi-select.
4. Same lead → **Calls** tab → "Log call" → outcome `INTERESTED` → "Next Interested Course" hint highlights.
5. Top-right **theme switcher** ☀ / 🌙 / ⌨ — choice persists across reload.

### Switching branches

```bash
# Currently on feature/course-interest-and-theme
git status

# To view what's on origin/main
git checkout main
git pull

# Back to today's work
git checkout feature/course-interest-and-theme
```

### Background processes

The dev servers I started during this session may or may not still be running. To check:
```bash
curl http://localhost:4000/api/health
curl http://localhost:5173
```
If either is down, restart as shown in "Running the app" above.

---

## Files added or changed in this session

```
Added:
- client/src/components/MultiSelect.tsx
- client/src/components/ThemeSelector.tsx
- client/src/components/CoursesPage.tsx
- client/src/hooks/useCourses.ts
- client/src/lib/theme.ts
- client/src/schemas/courses.schema.ts
- client/src/services/courses.api.ts
- server/src/modules/courses/         (schema, service, controller, routes)
- server/src/modules/leadCourseInterests/  (schema, service, controller, routes)

Extended:
- server/prisma/schema.prisma          (+ Course, + LeadCourseInterest, + Lead.courseInterests)
- server/prisma/schema.postgres.prisma (same)
- server/prisma/seed.ts                (+ 4 courses, + 6 demo interests, + cleanup)
- server/src/modules/calls/calls.schema.ts        (+ INTERESTED, + courseIds)
- server/src/modules/calls/calls.service.ts       (tx, persist interests when outcome=INTERESTED)
- server/src/modules/leads/leads.schema.ts        (+ courseId query)
- server/src/modules/leads/leads.service.ts       (filter, include interests)
- server/src/modules/dashboard/dashboard.service.ts (+ courseInterest aggregate)
- server/src/routes/index.ts                      (+ courses router, + interests router)
- client/src/types/domain.ts            (+ Course, + LeadCourseInterest, + courseInterests on Lead, + courseInterest on DashboardStats)
- client/src/schemas/calls.schema.ts    (+ INTERESTED, + courseIds)
- client/src/services/leads.api.ts      (+ courseId filter, + setCourseInterests)
- client/src/hooks/useLeads.ts          (+ useSetLeadInterests)
- client/src/pages/LeadDetailPage.tsx   (+ Courses tab, + MultiSelect in LogCallForm)
- client/src/pages/LeadsListPage.tsx    (+ course filter, + Courses column)
- client/src/pages/DashboardPage.tsx    (+ Course interest card)
- client/src/routes.tsx                 (+ /courses)
- client/src/components/Layout.tsx      (+ ThemeSelector, + Courses nav link)
- client/src/components/FormField.tsx   (+ hint prop)
- client/src/main.tsx                   (applyTheme, watchSystemTheme)
- client/index.html                     (+ pre-React theme bootstrap script)
- client/src/styles.css                 (CSS variables + :root[data-theme="dark"] + .multiselect-* + .theme-selector)
- client/src/App.tsx                    (+ /courses route registration)
- .gitignore                            (+ *.db exclusion)
- README.md                             (full rewrite)
```

---

## Known limitations (worth flagging in the final summary, but kept in scope)

- The "Other" course is just a regular row — agents can't enter a free-text alternative (would need a separate `customCourseName` field on the join — not in spec).
- A `LeadCourseInterest` row is only created from `logCall` when `outcome === "INTERESTED"`. If an agent later wants to retroactively attach a course to a previous call, they must use the Courses tab.
- Deactivated courses are still listed in the admin table but cannot be selected in new call forms. Historical interests are preserved but visually marked "(inactive)" on the lead's Courses tab.
- No automated tests for the new features (matches the project's current "no tests" state, per `README.md` §Out of Scope).

---

Welcome back! 🛬 — pick up at "Recommended next steps when you resume" above.
