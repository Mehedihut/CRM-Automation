# Resume note

> This file is a pickup anchor for future sessions. Delete once context is
> fully re-loaded into the conversation.

## Where we are

- **Branch**: `main`, clean working tree, in sync with `origin/main`.
- **Latest commit**: `2bc8416` — "Add tests for dashboard, whatsapp, team services".

## What's done

CRM-Automation is feature-complete on the API + SPA + Vercel-deploy axis:

1. Domain: 8 Prisma models (User, Lead, Call, WhatsAppMessage, FollowUp, PukuAccessRequest, AuditLog, PasswordResetToken) + 7 enums.
2. Backend: 9 route modules under `/api` (health, auth, leads, team, calls, whatsapp, follow-ups, puku-access, dashboard, audit) — full RBAC, Zod validation, Prisma error mapping.
3. Frontend: 13 pages + reusable components, public auth routes, admin-only `/team` + `/audit`.
4. Hardening (PR 1–4): JWT secret enforcement, secure cookies, request-id tracing, `/api/healthz` DB ping, `express-rate-limit` on `/api/auth/*`, audit log written in same transaction as the action, forgot-password with sha256-hashed 1h tokens, Vercel serverless entry + `vercel.json` for both projects.
5. Tests: 89 server + 34 client Vitest tests, all green. Coverage thresholds wired into CI (server 75/75/70/75, client 12/70/30/12).
6. CI: `.github/workflows/ci.yml` runs typecheck + `npm run test:coverage` for both projects in parallel; coverage artifacts uploaded.

## What's not done (deferred / known gaps)

- **Integration stubs** in `server/src/integrations/{meta,whatsapp,puku}.ts` throw 501 — no outbound WhatsApp send, no Meta webhook, no Puku provisioning call.
- **No live integration tests** — everything mocks Prisma at the boundary.
- **Coverage gaps**: `utils/` is at ~43% (mail/prismaErrors/asyncHandler/jwt have no direct tests); client pages other than Login/Forgot/Reset and components other than Button/StatusBadge/RouteGuard have no tests.
- **No ESLint** (`lint` scripts are placeholders).
- **No e2e** (Playwright/Cypress).
- **No seed script** for a fresh deployment.
- **No pagination** on list endpoints except `/api/audit`.

## How to resume

From `C:\Users\porid\CRM-Automation`, both projects typecheck and test cleanly:

```bash
cd server  && npm run typecheck && npm run test:coverage
cd client  && npm run typecheck && npm test
```

Recommended next steps when picking back up:
- Cover more client pages with tests (DashboardPage, LeadsPage are the most user-facing).
- Add direct tests for `server/src/utils/*` to push utils coverage up.
- Implement one of the integration stubs (Meta webhook is the highest-leverage — it's how leads actually arrive in production).
- Configure ESLint + Prettier.
