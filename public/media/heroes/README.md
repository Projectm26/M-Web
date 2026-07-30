# Hero campaigns

## Preferred: Web CMS (SQLite)

1. From `web/`, set `CMS_ACCESS_KEY` in `.env.local` (see `.env.example`).
2. Run `npm run dev:all` (Vite + CMS server).
3. Open [http://localhost:5173/cms](http://localhost:5173/cms), unlock with the key.
4. Upload images, edit CTA/copy/dates/priority, save.

Data lives in `web/data/` (gitignored). Public site reads `GET /cms-api/public/hero`.

## Fallback: JSON file

If the CMS server is offline, the site falls back to [`/hero-campaigns.json`](../../hero-campaigns.json).

You can still drop static art here (`sunset.jpg`, etc.) and reference `/media/heroes/...` from a campaign.
