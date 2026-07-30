# Shubh555 public site (M-Web)

Consumer marketing + live results for **Shubh555**. Homepage, charts, APK download, and a local hero CMS — product APIs come from [M-Backend](https://github.com/Projectm26/M-Backend).

Railway deploy: **[docs/RAILWAY.md](./docs/RAILWAY.md)**

## Local setup

```bash
cp .env.example .env   # set VITE_API_PROXY_TARGET + CMS_ACCESS_KEY
npm install
npm run dev:all        # Vite :5173 + CMS :8787
```

Open http://localhost:5173 — CMS admin at http://localhost:5173/cms

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite only |
| `npm run dev:cms` | Hero CMS only |
| `npm run dev:all` | Both |
| `npm run build` | Production `dist/` |
| `npm start` | Serve `dist/` + CMS (production mode) |
| `npm run preview` | Vite preview of `dist/` only (no CMS) |

## Env

| Variable | Purpose |
| --- | --- |
| `VITE_API_PROXY_TARGET` | Backend origin for Vite `/api` proxy (local) |
| `VITE_API_BASE_URL` | Absolute API origin **baked at production build** |
| `CMS_ACCESS_KEY` | Secret for `/cms` admin API |
| `CMS_PORT` | Local CMS port (default `8787`) |

Template for Railway: [docs/railway.web.env.example](./docs/railway.web.env.example).

## Production notes

- SPA routes `/`, `/chart`, `/cms` need the Node server (`npm start` / Docker) — plain static hosting without SPA fallback will 404 on refresh.
- Add the public web origin to API `ALLOWED_ORIGINS` or browser calls will fail CORS.
- Mount `/app/data` for CMS SQLite + uploads.

## Stack

Vite + React + TypeScript, React Router, Day.js, Lucide, Hono CMS + better-sqlite3.
