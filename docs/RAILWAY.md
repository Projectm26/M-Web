# Railway setup — M-Web (public site)

Deploy the consumer marketing + live results site ([Projectm26/M-Web](https://github.com/Projectm26/M-Web)) on Railway alongside the API and Admin.

## What this service runs

One container:

1. **Vite SPA** (`dist/`) — homepage, charts, `/cms` UI  
2. **Hero CMS** (Hono + SQLite) — `/cms-api/*`, `/cms-media/*`  
3. **Health** — `GET /healthz`

Product data (markets, rates, lottery, APK download) still comes from **M-Backend** via `VITE_API_BASE_URL`.

```mermaid
flowchart LR
  Browser --> Web[M-Web Railway]
  Web -->|static SPA| Dist[dist]
  Web -->|hero CMS| Sqlite[(data/cms.sqlite)]
  Browser -->|VITE_API_BASE_URL| API[M-Backend]
```

## Dockerfile

Repo root `Dockerfile` (multi-stage). Builder requires:

```bash
VITE_API_BASE_URL=https://<api>.up.railway.app
```

Leave empty = build fails (no hardcoded API host).

**Railway + Docker:** service Variables are passed into the image build as `--build-arg` **only if** the Dockerfile declares a matching `ARG` (same name). M-Web declares `ARG VITE_API_BASE_URL` — keep the Variable name exact. Do not use a different key (e.g. `BUILD_VITE_API_BASE_URL`) unless you also rename the ARG.

If the value uses a Railway reference (`${{Api.RAILWAY_PUBLIC_DOMAIN}}`), that service must already have a public domain or the build-arg resolves empty.

## Deploy steps

1. Railway → New service → GitHub `Projectm26/M-Web` → branch `main`.
2. Builder: **Dockerfile** / path `Dockerfile` (from `railway.toml`).
3. **Variables** — paste [railway.web.env.example](./railway.web.env.example):
   - `VITE_API_BASE_URL` — **exact name**, set **before** first build (literal `https://…up.railway.app` or a resolved `${{…}}` reference)
   - `CMS_ACCESS_KEY` (long random)
4. **Volume** → mount **`/app/data`**, replicas **1**.  
   The image entrypoint chowns this path on boot (Railway volumes are root-owned; the app runs as `web`).  
   Image base is **Debian slim** (not Alpine) so `better-sqlite3` does not depend on `unofficial-builds.nodejs.org` during Railway builds.
5. Generate public domain → note `https://<web>.up.railway.app`.
6. On **M-Backend** variables, add that origin to `ALLOWED_ORIGINS` (comma-separated), then redeploy API.
7. Deploy Web. Healthcheck: **`GET /healthz`**.

## Routes

| Path | Purpose |
|---|---|
| `/` | Homepage (site root — **not** `/web`) |
| `/chart` | Charts (SPA) |
| `/cms` | Hero CMS admin UI (banner upload) |
| `/cms-api/public/hero` | Public hero campaigns |
| `/cms-api/*` | CMS admin API (needs `x-cms-key`) |
| `/cms-media/heroes/*` | Uploaded hero images |
| `/healthz` | Liveness (`cmsAuthConfigured`, `uploadsWritable`) |
| `/hero-campaigns.json` | Static fallback if CMS offline |

> There is no `/web` URL prefix. Host this service at the domain root (or a subdomain). Putting it behind `/web/...` breaks assets and CMS.

## Banner upload checklist

If `/cms` unlock works but upload fails:

1. **`CMS_ACCESS_KEY`** set on Railway (runtime) — `/healthz` must show `"cmsAuthConfigured": true`
2. **Volume** mounted at **`/app/data`**, replicas = **1**
3. **No custom Start Command** in Railway (must use Dockerfile entrypoint so volume is chowned)
4. `/healthz` shows `"uploadsWritable": true`
5. Locally: use `npm run dev:all` (Vite alone cannot upload — CMS must be on `:8787`)

## Local vs production

| | Local | Railway |
|---|---|---|
| Frontend | `npm run dev` (Vite `:5173`) | Served from `dist/` by CMS process |
| API | Vite proxies `/api` → `VITE_API_PROXY_TARGET` | Browser → `VITE_API_BASE_URL` directly |
| CMS | `npm run dev:cms` (`:8787`) | Same process, `PORT` from Railway |

```bash
cp .env.example .env
npm install
npm run dev:all
```

## After API URL changes

Rebuild/redeploy M-Web so Vite re-bakes `VITE_API_BASE_URL`.
