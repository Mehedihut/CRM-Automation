# Server image — Node 20, multi-stage build, runs migrations + seed on start.
# IMPORTANT: This Dockerfile expects the production Postgres schema
# (`prisma/schema.postgres.prisma`) to be the active schema. If you have
# `prisma/schema.prisma` checked out as the SQLite dev variant, copy
# `schema.postgres.prisma` over it before building:
#   cp prisma/schema.postgres.prisma prisma/schema.prisma
# Then revert it when going back to local dev.

# ── 1. Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps with the lockfile for reproducibility
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Generate the Prisma client against the Postgres schema
RUN npx prisma generate

# Build TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── 2. Runtime stage ───────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Install only production deps + Prisma CLI for migrations
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm install --no-save prisma@5.22.0 tsx@4.23.13

# Copy the compiled output + Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy the entrypoint that runs migrations + seed then starts the server
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
