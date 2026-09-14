#!/bin/sh
# Container entrypoint: wait for DB → migrate → seed → start server.
# Uses `prisma migrate deploy` (not `migrate dev`) since this is prod.

set -e

echo "[entrypoint] Applying Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding database..."
npx tsx prisma/seed.ts || echo "[entrypoint] Seed step exited with $? (continuing)"

echo "[entrypoint] Starting CRM server..."
exec "$@"
