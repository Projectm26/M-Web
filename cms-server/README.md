# Web Hero CMS

Local SQLite CMS for homepage hero campaigns. Does **not** use the Shubh555 product database.

## Quick start

```bash
cd web
cp .env.example .env.local   # set CMS_ACCESS_KEY
npm run dev:all              # Vite :5173 + CMS :8787
```

Open `/cms`, paste the access key, manage campaigns.

## Env

| Variable | Purpose |
|----------|---------|
| `CMS_ACCESS_KEY` | Required secret for admin API (`x-cms-key` header) |
| `CMS_PORT` | CMS server port (default `8787`) |
| `VITE_CMS_PROXY_TARGET` | Vite proxy target (default `http://127.0.0.1:8787`) |

## API

- `GET /cms-api/public/hero` — public campaign list (no auth)
- `POST /cms-api/auth/verify` — check key
- `GET/POST/PUT/DELETE /cms-api/campaigns` — admin CRUD (auth)
- `POST /cms-api/upload` — image upload (auth)
- `GET /cms-media/heroes/:file` — uploaded images

## Storage

- DB: `web/data/cms.sqlite`
- Uploads: `web/data/uploads/heroes/`
