import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apkDownloadUrl, lottery, website } from "../config/api";
import { fetchJson } from "../lib/fetchWebsite";
import type {
  GameRate,
  LiveResultItem,
  LotteryGame,
  LotteryResultRow,
  MarketGame,
  SupportInfo,
  TimedGame,
} from "../lib/types";
import { dayjs } from "../lib/time";
import { normalizeGameResultDisplay, isDigitResult } from "../lib/resultFormat";

export function openApkDownload() {
  window.open(apkDownloadUrl, "_blank", "noopener,noreferrer");
}

const CACHE_KEY = "shubh555-home-cache-v2";

function sanitizeResultData(value?: string | null) {
  if (value == null) return value ?? undefined;
  const raw = String(value).trim();
  if (!raw) return raw;
  if (/market is|running now/i.test(raw)) return raw;
  if (isDigitResult(raw) || /[_*]/.test(raw)) {
    return normalizeGameResultDisplay(raw, "***-**-***");
  }
  return raw.replace(/_/g, "-");
}

function sanitizeMarketGames<T extends { resultData?: string }>(games: T[]): T[] {
  return games.map((game) =>
    game.resultData == null
      ? game
      : { ...game, resultData: sanitizeResultData(game.resultData) as string },
  );
}

interface HomeCache {
  rates: GameRate[];
  games: MarketGame[];
  supportNumber: string;
  starlineGames: TimedGame[];
  jackpotGames: TimedGame[];
  nightGames: MarketGame[];
  lotteryGames: LotteryGame[];
  lotteryResults: LotteryResultRow[];
  savedAt: number;
}

interface HomeData {
  rates: GameRate[];
  games: MarketGame[];
  supportNumber: string;
  starlineGames: TimedGame[];
  jackpotGames: TimedGame[];
  nightGames: MarketGame[];
  lotteryGames: LotteryGame[];
  lotteryResults: LotteryResultRow[];
  liveResults: LiveResultItem[];
  mainGames: MarketGame[];
  jackpotSummary: MarketGame | null;
  starlineSummary: MarketGame | null;
  marketsLoading: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function isSummaryMarketName(name: string) {
  return (
    name.toLowerCase().includes("testing") ||
    /^(?:Bombay\s+)?Jackpot\b/i.test(name) ||
    /^(?:Bombay\s+)?Starline\b/i.test(name)
  );
}

async function settledJson<T extends Record<string, unknown>>(
  url: string,
): Promise<T | null> {
  try {
    return await fetchJson<T>(url);
  } catch (e) {
    console.warn("[website]", url, e);
    return null;
  }
}

function readCache(): HomeCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeCache;
    if (!parsed?.games?.length) return null;
    return {
      ...parsed,
      games: sanitizeMarketGames(parsed.games),
      nightGames: sanitizeMarketGames(parsed.nightGames ?? []),
    };
  } catch {
    return null;
  }
}

function writeCache(payload: Omit<HomeCache, "savedAt">) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() } satisfies HomeCache),
    );
  } catch {
    /* quota / private mode */
  }
}

export function useHomeData(): HomeData {
  const cached = useMemo(() => readCache(), []);
  const snapshot = useRef({
    rates: cached?.rates ?? ([] as GameRate[]),
    games: cached?.games ?? ([] as MarketGame[]),
    supportNumber: cached?.supportNumber ?? "",
    starlineGames: cached?.starlineGames ?? ([] as TimedGame[]),
    jackpotGames: cached?.jackpotGames ?? ([] as TimedGame[]),
    nightGames: cached?.nightGames ?? ([] as MarketGame[]),
    lotteryGames: cached?.lotteryGames ?? ([] as LotteryGame[]),
    lotteryResults: cached?.lotteryResults ?? ([] as LotteryResultRow[]),
  });

  const [rates, setRates] = useState<GameRate[]>(snapshot.current.rates);
  const [games, setGames] = useState<MarketGame[]>(snapshot.current.games);
  const [supportNumber, setSupportNumber] = useState(snapshot.current.supportNumber);
  const [starlineGames, setStarlineGames] = useState<TimedGame[]>(
    snapshot.current.starlineGames,
  );
  const [jackpotGames, setJackpotGames] = useState<TimedGame[]>(
    snapshot.current.jackpotGames,
  );
  const [nightGames, setNightGames] = useState<MarketGame[]>(snapshot.current.nightGames);
  const [lotteryGames, setLotteryGames] = useState<LotteryGame[]>(
    snapshot.current.lotteryGames,
  );
  const [lotteryResults, setLotteryResults] = useState<LotteryResultRow[]>(
    snapshot.current.lotteryResults,
  );
  const hasCache = snapshot.current.games.length > 0;
  const [marketsLoading, setMarketsLoading] = useState(!hasCache);
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);

      try {
        // Markets paint from get-games alone (includes Jackpot + Starline results).
        // Removed ank-chart fan-out — that was the main homepage lag.
        const gamesPromise = settledJson<{ updatedGames: MarketGame[] }>(website.games);

        const secondaryPromise = Promise.all([
          settledJson<{ data: GameRate[] }>(website.rates),
          settledJson<{ admin_info: SupportInfo | null }>(website.support),
          settledJson<{ starline_games: TimedGame[] }>(website.starlineList),
          settledJson<{ jackpot_games: TimedGame[] }>(website.jackpotList),
          settledJson<{ night_games: MarketGame[] }>(website.nightMarkets),
          settledJson<{ data: LotteryGame[] }>(lottery.games),
          settledJson<{ data: LotteryResultRow[] }>(lottery.results),
        ]);

        const gamesRes = await gamesPromise;
        if (cancelled) return;

        if (gamesRes?.updatedGames?.length) {
          const games = sanitizeMarketGames(gamesRes.updatedGames);
          snapshot.current.games = games;
          setGames(games);
          setMarketsLoading(false);
        }

        const [
          ratesRes,
          supportRes,
          starlineRes,
          jackpotRes,
          nightRes,
          lotteryGamesRes,
          lotteryResultsRes,
        ] = await secondaryPromise;

        if (cancelled) return;

        if (!gamesRes && !ratesRes && !starlineRes && !jackpotRes) {
          if (!snapshot.current.games.length) {
            setError(
              "Couldn’t reach the backend. Check VITE_API_PROXY_TARGET / VITE_API_BASE_URL and restart npm run dev.",
            );
          }
          return;
        }

        const next = { ...snapshot.current };
        if (gamesRes?.updatedGames) next.games = sanitizeMarketGames(gamesRes.updatedGames);
        if (ratesRes?.data) next.rates = ratesRes.data;
        if (supportRes?.admin_info?.support_number) {
          next.supportNumber = supportRes.admin_info.support_number;
        }
        if (starlineRes?.starline_games) next.starlineGames = starlineRes.starline_games;
        if (jackpotRes?.jackpot_games) next.jackpotGames = jackpotRes.jackpot_games;
        if (nightRes?.night_games) next.nightGames = sanitizeMarketGames(nightRes.night_games);
        if (lotteryGamesRes?.data) next.lotteryGames = lotteryGamesRes.data;
        if (lotteryResultsRes?.data) next.lotteryResults = lotteryResultsRes.data;

        snapshot.current = next;
        setGames(next.games);
        setRates(next.rates);
        setSupportNumber(next.supportNumber);
        setStarlineGames(next.starlineGames);
        setJackpotGames(next.jackpotGames);
        setNightGames(next.nightGames);
        setLotteryGames(next.lotteryGames);
        setLotteryResults(next.lotteryResults);
        writeCache(next);
      } catch (e) {
        if (!cancelled && !snapshot.current.games.length) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setMarketsLoading(false);
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const mainGames = useMemo(() => {
    return games.slice(2).filter((g) => !isSummaryMarketName(g.game_name || ""));
  }, [games]);

  const jackpotSummary = useMemo(() => {
    return games.find((g) => /^(?:Bombay\s+)?Jackpot\b/i.test(g.game_name || "")) ?? null;
  }, [games]);

  const starlineSummary = useMemo(() => {
    return games.find((g) => /^(?:Bombay\s+)?Starline\b/i.test(g.game_name || "")) ?? null;
  }, [games]);

  const liveResults = useMemo(() => {
    const items: LiveResultItem[] = [];
    for (const game of games.slice(2)) {
      const name = game.game_name || "";
      if (isSummaryMarketName(name)) continue;
      const result = game.resultData?.trim();
      if (!result || result === "---") continue;
      if (/market is|running now/i.test(result)) continue;
      const normalized = result.replace(/_/g, "-");
      const timestamp = game.close_time
        ? dayjs(game.close_time, "HH:mm:ss").valueOf()
        : dayjs().valueOf();
      items.push({
        gameName: name,
        result: normalized,
        timestamp,
      });
    }
    // Prefer boards with declared digits; fall back to pending placeholders.
    const sorted = items.sort((a, b) => b.timestamp - a.timestamp);
    const declared = sorted.filter((item) => /\d/.test(item.result));
    return (declared.length ? declared : sorted).slice(0, 8);
  }, [games]);

  return {
    rates,
    games,
    supportNumber,
    starlineGames,
    jackpotGames,
    nightGames,
    lotteryGames,
    lotteryResults,
    liveResults,
    mainGames,
    jackpotSummary,
    starlineSummary,
    marketsLoading,
    loading,
    error,
    refresh,
  };
}
