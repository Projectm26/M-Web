/**
 * Backend origin — no trailing slash.
 *
 * - Dev: same-origin `/api` via Vite proxy (avoids CORS).
 * - Prod: `VITE_API_BASE_URL` absolute origin (baked at Docker/Vite build).
 */
const isDev = import.meta.env.DEV;

const raw = import.meta.env.VITE_API_BASE_URL;
const configured =
  raw === undefined || raw === null || String(raw).trim() === ""
    ? ""
    : String(raw).replace(/\/$/, "");

export const API_BASE = isDev ? "" : configured;

if (!isDev && !API_BASE) {
  console.warn(
    "[web] VITE_API_BASE_URL is empty — API calls will hit this origin and fail. Set it at build time.",
  );
}

export const apkDownloadUrl = `${API_BASE}/api/app/download`;

export const website = {
  games: `${API_BASE}/api/website/get-games`,
  rates: `${API_BASE}/api/website/get-games-rates`,
  support: `${API_BASE}/api/website/get-support`,
  starlineList: `${API_BASE}/api/website/get-starline-panachart`,
  starlineAnk: `${API_BASE}/api/website/get-starline-ankchart`,
  starlineDayChart: `${API_BASE}/api/website/get-starline-daychart`,
  jackpotList: `${API_BASE}/api/website/get-jackpot-jodichart`,
  jackpotAnk: `${API_BASE}/api/website/get-jackpot-ankchart`,
  jackpotDayChart: `${API_BASE}/api/website/get-jackpot-daychart`,
  festivalSkin: `${API_BASE}/api/website/get-festival-skin`,
  jodiAnk: `${API_BASE}/api/website/get-main-jodi-ankchart`,
  panaAnk: `${API_BASE}/api/website/get-main-pana-ankchart`,
  nightJodiAnk: `${API_BASE}/api/website/get-night-jodi-ankchart`,
  nightPanaAnk: `${API_BASE}/api/website/get-night-pana-ankchart`,
  nightMarkets: `${API_BASE}/api/website/get-night-markets`,
} as const;

export const lottery = {
  games: `${API_BASE}/api/lottery/games`,
  results: `${API_BASE}/api/lottery/results?limit=5`,
} as const;
