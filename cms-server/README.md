# Web Hero CMS

SQLite CMS for homepage hero campaigns. Does **not** use the Shubh555 product database.

## Quick start

```bash
cp .env.example .env.local   # set CMS_ACCESS_KEY
npm run dev:all              # Vite :5173 + CMS :8787
```

Open `/cms`, paste the access key, manage campaigns.

## Env

| Variable | Purpose |
|----------|---------|
| `CMS_ACCESS_KEY` | Required secret for admin API (`x-cms-key` header) |
| `CMS_PORT` | Local CMS port (default `8787`) |
| `PORT` / `HOST` | Production listen (Railway injects `PORT`; image uses `0.0.0.0`) |
| `VITE_CMS_PROXY_TARGET` | Vite proxy target (default `http://127.0.0.1:8787`) |

## API

- `GET /cms-api/public/hero` — public campaign list (no auth)
- `POST /cms-api/auth/verify` — check key
- `GET/POST/PUT/DELETE /cms-api/campaigns` — admin CRUD (auth)
- `POST /cms-api/upload` — image upload (auth)
- `GET /cms-media/heroes/:file` — uploaded images
- `GET /healthz` — liveness (SPA + CMS process)

## Storage

- DB: `data/cms.sqlite` (Railway volume `/app/data`)
- Uploads: `data/uploads/heroes/`

In production the same process also serves the Vite `dist/` SPA (see [docs/RAILWAY.md](../docs/RAILWAY.md)).
