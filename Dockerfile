# syntax=docker/dockerfile:1.6
#
# shubh555-web (M-Web) — production image. Build from repo root:
#   docker build -t shubh555-web:latest \
#     --build-arg VITE_API_BASE_URL=https://api.example.com \
#     -f Dockerfile .
#
# Railway: set service Variable VITE_API_BASE_URL *before* first build
# (baked into the client). Railway only forwards vars that are declared
# as matching ARG names in this Dockerfile — see docs.railway.com/builds/dockerfiles
# Mount a Volume at /app/data for CMS SQLite + hero uploads.
# Add this site's public origin to the API service ALLOWED_ORIGINS.

# ----- Build (Vite SPA) ------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# Bake API origin into the Vite client.
#
# Railway injects service Variables as docker --build-arg ONLY when the
# Dockerfile declares a matching ARG (same name). Do not rename this ARG.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    NODE_ENV=production

RUN if [ -z "$VITE_API_BASE_URL" ]; then \
      echo "ERROR: VITE_API_BASE_URL is empty at build time."; \
      echo "In Railway → M-Web → Variables, set (exact name):"; \
      echo "  VITE_API_BASE_URL=https://<your-api>.up.railway.app"; \
      echo "(no trailing slash, no /api suffix). Then Redeploy."; \
      echo "Local: docker build --build-arg VITE_API_BASE_URL=https://api.example.com ."; \
      exit 1; \
    fi \
 && echo "Building with VITE_API_BASE_URL=$VITE_API_BASE_URL" \
 && npm run build

# ----- Runtime (static SPA + hero CMS) ---------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="shubh555-web" \
      org.opencontainers.image.description="Shubh555 public marketing site"

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NPM_CONFIG_LOGLEVEL=warn

# su-exec: drop root → web after chown'ing the Railway volume at /app/data
RUN apk add --no-cache python3 make g++ curl su-exec \
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
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh \
 && chown -R web:web /app/dist /app/cms-server /app/public /app/data

# Start as root so entrypoint can chown the mounted volume, then su-exec to web.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npx", "tsx", "cms-server/index.ts"]
