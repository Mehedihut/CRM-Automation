# Client image — multi-stage: build the Vite app, then serve with Nginx.
# Nginx proxies /api/* to the server container so the user only needs port 8080.

# ── 1. Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.node.json ./
COPY index.html ./
COPY vite.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

# ── 2. Runtime stage ───────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Replace the default site with our SPA-aware + API-proxying config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets from the Vite build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
