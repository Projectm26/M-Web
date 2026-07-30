# syntax=docker/dockerfile:1.6
#
# shubh555-web (M-Web) — production image. Build from repo root:
#   docker build -t shubh555-web:latest \
#     --build-arg VITE_API_BASE_URL=https://api.example.com \
#     -f Dockerfile .
#
# Railway: set VITE_API_BASE_URL before first build (baked into the client).
# Mount a Volume at /app/data for CMS SQLite + hero uploads.
# Add this site's public origin to the API service ALLOWED_ORIGINS.

# ----- Build (Vite SPA) ------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    NODE_ENV=production

RUN test -n "$VITE_API_BASE_URL" || (echo "ERROR: VITE_API_BASE_URL must be set at build time (API public origin, no /api suffix)" && exit 1)

RUN npm run build

# ----- Runtime (static SPA + hero CMS) ---------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="shubh555-web" \
      org.opencontainers.image.description="Shubh555 public marketing site"

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NPM_CONFIG_LOGLEVEL=warn

RUN apk add --no-cache python3 make g++ curl \
 && addgroup -S web && adduser -S web -G web \
 && mkdir -p /app/data/uploads/heroes \
 && chown -R web:web /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
 && apk del python3 make g++ \
 && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY cms-server ./cms-server
COPY public/hero-campaigns.json ./public/hero-campaigns.json
COPY data/.gitkeep ./data/.gitkeep

USER web

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1

CMD ["npx", "tsx", "cms-server/index.ts"]
