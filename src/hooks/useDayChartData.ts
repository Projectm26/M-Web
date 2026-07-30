import { useEffect, useState } from "react";
import { website } from "../config/api";
import { fetchJson } from "../lib/fetchWebsite";

export type DayChartKind =
  | "starline-day"
  | "starline-night"
  | "jackpot-day"
  | "jackpot-night";

export interface DayChartRow {
  date: string;
  cells: Array<string | null>;
}

export interface DayChartViewState {
  hours: number[];
  rows: DayChartRow[];
  rangeLabel: string;
  loading: boolean;
  error: string | null;
}

interface DayChartApiResponse {
  status?: string;
  message?: string;
  hours?: number[];
  rangeLabel?: string;
  days?: Array<{ date?: string; cells?: Array<string | null> }>;
}

const DAY_CHART_META: Record<
  DayChartKind,
  { product: "starline" | "jackpot"; night: 0 | 1; title: string; subtitle: string }
> = {
  "starline-day": {
    product: "starline",
    night: 0,
    title: "Starline Day",
    subtitle: "8:00 AM – 7:00 PM · 12 hourly columns",
  },
  "starline-night": {
    product: "starline",
    night: 1,
    title: "Starline Night",
    subtitle: "8:00 PM – 7:00 AM · 12 hourly columns",
  },
  "jackpot-day": {
    product: "jackpot",
    night: 0,
    title: "Jackpot Day",
    subtitle: "8:00 AM – 7:00 PM · 12 hourly columns",
  },
  "jackpot-night": {
    product: "jackpot",
    night: 1,
    title: "Jackpot Night",
    subtitle: "8:00 PM – 7:00 AM · 12 hourly columns",
  },
};

export function isDayChartKind(raw: string | null): raw is DayChartKind {
  return (
    raw === "starline-day" ||
    raw === "starline-night" ||
    raw === "jackpot-day" ||
    raw === "jackpot-night"
  );
}

export function dayChartMeta(kind: DayChartKind) {
  return DAY_CHART_META[kind];
}

function dayChartUrl(kind: DayChartKind): string {
  const meta = DAY_CHART_META[kind];
  const base =
    meta.product === "starline" ? website.starlineDayChart : website.jackpotDayChart;
  const qs = new URLSearchParams({
    night: String(meta.night),
  });
  return `${base}?${qs.toString()}`;
}

export function useDayChartView(kind: DayChartKind | null): DayChartViewState {
  const [hours, setHours] = useState<number[]>([]);
  const [rows, setRows] = useState<DayChartRow[]>([]);
  const [rangeLabel, setRangeLabel] = useState("");
  const [loading, setLoading] = useState(Boolean(kind));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kind) {
      setHours([]);
      setRows([]);
      setRangeLabel("");
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchJson<DayChartApiResponse>(dayChartUrl(kind!));
        if (cancelled) return;
        const nextHours = Array.isArray(res.hours) ? res.hours.map(Number) : [];
        const nextRows: DayChartRow[] = (res.days ?? [])
          .map((d) => ({
            date: String(d.date || "").slice(0, 10),
            cells: Array.isArray(d.cells) ? d.cells : [],
          }))
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date));
        setHours(nextHours);
        setRows(nextRows);
        setRangeLabel(res.rangeLabel || "");
        if (!nextRows.length) {
          setError("No day-chart rows yet for this board.");
        }
      } catch (e) {
        if (!cancelled) {
          setHours([]);
          setRows([]);
          setRangeLabel("");
          setError(e instanceof Error ? e.message : "Failed to load day chart");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { hours, rows, rangeLabel, loading, error };
}
