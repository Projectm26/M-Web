import { useEffect, useMemo, useState } from "react";
import { website } from "../config/api";
import { postJson, fetchJson } from "../lib/fetchWebsite";
import {
  buildWeekGrid,
  chartPlaceholder,
  flattenAnkDetails,
  sessionsToRows,
  type ChartKind,
  type ChartSession,
  type ChartWeekRow,
} from "../lib/chartFormat";
import type { MarketGame } from "../lib/types";

interface AnkResponse extends Record<string, unknown> {
  status?: string;
  ankDetails?: unknown;
  game_name?: string;
}

export interface ChartViewState {
  weeks: ChartWeekRow[];
  gameName: string;
  loading: boolean;
  error: string | null;
}

function ankUrl(kind: ChartKind): string {
  if (kind === "jodi") return website.jodiAnk;
  if (kind === "pana") return website.panaAnk;
  if (kind === "starline") return website.starlineAnk;
  return website.jackpotAnk;
}

export function useChartView(
  kind: ChartKind | null,
  gameId: string | null,
): ChartViewState {
  const [weeks, setWeeks] = useState<ChartWeekRow[]>([]);
  const [gameName, setGameName] = useState("");
  const [loading, setLoading] = useState(Boolean(kind && gameId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kind || !gameId) {
      setWeeks([]);
      setGameName("");
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await postJson<AnkResponse>(ankUrl(kind!), {
          game_id: Number.isFinite(Number(gameId)) ? Number(gameId) : gameId,
        });
        if (cancelled) return;
        const sessions = flattenAnkDetails(res.ankDetails) as ChartSession[];
        const rows = sessionsToRows(kind!, sessions);
        setWeeks(buildWeekGrid(rows));
        setGameName(res.game_name || "");
        if (!rows.length) {
          setError("No chart rows yet for this market.");
        }
      } catch (e) {
        if (!cancelled) {
          setWeeks([]);
          setError(e instanceof Error ? e.message : "Failed to load chart");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, gameId]);

  return { weeks, gameName, loading, error };
}

export interface ChartHubLists {
  mainGames: MarketGame[];
  loading: boolean;
}

function isSummaryName(name: string) {
  return (
    name.toLowerCase().includes("testing") ||
    /^Jackpot\b/i.test(name) ||
    /^Starline\b/i.test(name)
  );
}

export function useChartHub(): ChartHubLists {
  const [mainGames, setMainGames] = useState<MarketGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const gamesRes = await fetchJson<{ updatedGames: MarketGame[] }>(
          website.games,
        ).catch(() => null);
        if (cancelled) return;
        const games = gamesRes?.updatedGames ?? [];
        setMainGames(
          games.slice(2).filter((g) => !isSummaryName(g.game_name || "")),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { mainGames, loading };
}

export function useEmptyPlaceholder(kind: ChartKind | null) {
  return useMemo(() => (kind ? chartPlaceholder(kind) : "***-**-***"), [kind]);
}
