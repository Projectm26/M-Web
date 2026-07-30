# Shubh555 public site

Consumer marketing + live results site for **Shubh555**. Phase 1 ships the homepage (rates, live markets, APK download) against existing `/api/website/*` endpoints.

## Setup

```bash
cd web
cp .env.example .env   # edit VITE_API_BASE_URL if needed
npm install
npm run dev
```

Open http://localhost:5173

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

## Env

| Variable | Purpose |
| --- | --- |
| `VITE_API_PROXY_TARGET` | Backend origin for the Vite `/api` proxy in local dev |
| `VITE_API_BASE_URL` | Absolute API origin for production builds (leave empty in dev) |

In local dev the browser calls `/api/...` on the Vite server; Vite proxies to `VITE_API_PROXY_TARGET`. That avoids CORS issues.

APK download: `{API}/api/app/download`

After changing `.env`, restart `npm run dev`.


## Stack

Vite + React + TypeScript, React Router, Day.js, Lucide icons. Design tokens follow Sunset Pulse (`#D86438`).
