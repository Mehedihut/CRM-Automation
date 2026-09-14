# CRM-Automation — Docker runbook

This is the production-style stack: **Postgres + Adminer + Express server + React client**, all orchestrated by `docker-compose.yml`.

## Prerequisites

1. **Install Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/
2. After install, restart Windows (the installer asks for it).
3. Launch **Docker Desktop** from the Start menu. Wait for the whale icon in the system tray to stop animating.
4. Verify in PowerShell / Git Bash:
   ```bash
   docker --version
   docker compose version
   ```
   Both should print version numbers. If you see "command not found", Docker isn't on PATH yet — restart your terminal.

## Before first build

The project currently ships two Prisma schemas:
- `server/prisma/schema.prisma` — **SQLite** (dev mode, what you ran with `npm run dev`)
- `server/prisma/schema.postgres.prisma` — **Postgres** (Docker / production)

The Docker build needs the **Postgres** schema to be the active one. Before building, swap them:

```bash
cd "C:\Users\1\Desktop\Puku CRM\CRM-Automation"
# Save the current SQLite schema aside (optional, for going back)
copy server\prisma\schema.prisma server\prisma\schema.sqlite.prisma
copy server\prisma\seed.ts       server\prisma\seed.sqlite.ts

# Make the Postgres schema active
copy server\prisma\schema.postgres.prisma server\prisma\schema.prisma
copy server\prisma\seed.postgres.ts       server\prisma\seed.ts
```

> The seed file uses the **same code** for both backends — only the schema's provider changes. The current `seed.ts` is already Postgres-compatible (it imports from `@prisma/client`).

To go back to local dev (no Docker), run the reverse:
```bash
copy server\prisma\schema.sqlite.prisma server\prisma\schema.prisma
copy server\prisma\seed.sqlite.ts       server\prisma\seed.ts
npx prisma generate
```

## Bring the stack up

From the repo root:

```bash
docker compose up -d --build
```

This will:
1. Pull `postgres:16-alpine`, `adminer:4`, `nginx:1.27-alpine`.
2. Build the server image (Node 20, installs deps, generates Prisma client, compiles TS).
3. Build the client image (Node 20, builds Vite, then Nginx serves the result).
4. Wait for Postgres to be healthy.
5. Run `prisma migrate deploy` inside the server container (creates tables).
6. Run the seed script (creates users + sample data).
7. Start the server.

Watch the logs:
```bash
docker compose logs -f server
```
You should see `[INFO] CRM-Automation API listening on port 4000 (env: production)` once it's up.

## Open the app

| Service | URL |
|---|---|
| **App (single-port via Nginx)** | **http://localhost:8080** |
| Adminer (DB UI)               | http://localhost:8081 |
| Postgres (direct, optional)   | `localhost:5432` (user `crm`, pass `crm`, db `crm`) |
| Server API (direct, optional) | http://localhost:4000/api/health |

## Default login

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| ADMIN | `admin@crm.local`  | `admin123`|
| AGENT | `agent1@crm.local` | `agent123`|
| AGENT | `agent2@crm.local` | `agent123`|

## Day-to-day commands

```bash
# Tail all logs
docker compose logs -f

# Tail just the server
docker compose logs -f server

# Restart only the server (after code changes — image must be rebuilt)
docker compose up -d --build server

# Stop everything (keeps the Postgres volume)
docker compose down

# Stop + delete the Postgres volume (wipes all data)
docker compose down -v

# Open a shell in the server container
docker compose exec server sh

# Re-run the seed manually
docker compose exec server npx tsx prisma/seed.ts

# Re-run migrations
docker compose exec server npx prisma migrate deploy
```

## Production checklist (when you actually deploy this)

- [ ] Change `JWT_SECRET` in `docker-compose.yml` to a long random value.
- [ ] Change the Postgres password (`POSTGRES_PASSWORD`).
- [ ] Set `CLIENT_ORIGIN` to your real domain.
- [ ] Put the app behind a reverse proxy (Caddy / Traefik / Cloudflare) with TLS.
- [ ] Configure persistent backups for the `crm_pgdata` volume.

## Troubleshooting

**`docker: command not found`** — Docker isn't installed or your terminal wasn't restarted. Re-open PowerShell/Git Bash after installing Docker Desktop.

**`port 8080 is already allocated`** — Something else on your machine uses port 8080. Edit `docker-compose.yml` and change `"8080:80"` under `client:` to a free port (e.g. `"8088:80"`).

**Server logs show `P1001: Can't reach database server`** — Postgres isn't healthy yet. Wait a few seconds, or `docker compose logs postgres`. The server waits for the healthcheck, but if you ran the compose before the volume was first created, you may need `docker compose down -v` then `docker compose up -d --build` once.

**Login doesn't work after a fresh stack** — The seed only runs on a fresh DB. If the volume already existed, run `docker compose exec server npx tsx prisma/seed.ts` manually.

**`prisma generate` errors during build** — You forgot to swap to the Postgres schema (see "Before first build" above). The active `server/prisma/schema.prisma` must have `provider = "postgresql"`.
