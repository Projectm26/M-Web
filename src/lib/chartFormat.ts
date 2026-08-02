import type { Dayjs } from "dayjs";
import { dayjs } from "./time";
import { normalizeGameResultDisplay } from "./resultFormat";

export type ChartKind = "jodi" | "pana" | "starline" | "jackpot";

export interface ChartSession {
  session_id?: string;
  datetime?: string;
  open_panna?: string | number | null;
  close_panna?: string | number | null;
  open_digit?: string | number | null;
  close_digit?: string | number | null;
  game_result?: string | null;
  resultData?: string | null;
  result?: string | null;
  colour?: string | null;
  day?: string;
  [key: string]: unknown;
}

export interface ChartResultRow {
  date: string; // YYYY-MM-DD
  result: string;
  colour?: string | null;
}

export interface ChartWeekRow {
  rangeStart: string;
  rangeEnd: string;
  days: Array<ChartResultRow | null>;
}

export interface WinBadge {
  text: string;
  isPlaceholder: boolean;
  highlight: boolean;
}

export const CHART_DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function chartPlaceholder(kind: ChartKind): string {
  if (kind === "starline") return "***-*";
  if (kind === "jackpot" || kind === "jodi") return "**";
  return "***-**-***";
}

export function chartAccent(kind: ChartKind): "main" | "starline" | "jackpot" {
  if (kind === "starline") return "starline";
  if (kind === "jackpot") return "jackpot";
  return "main";
}

function field(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t ? t : null;
}

function displayPanna(value: string | number | null | undefined): string | null {
  const t = field(value);
  if (!t) return null;
  return t.padStart(3, "0");
}

function displayDigit(value: string | number | null | undefined): string | null {
  return field(value);
}

/** Build display string for a session — matches app formatChartSessionResult (+ jodi-only). */
export function formatChartSessionResult(kind: ChartKind, session: ChartSession): string {
  const fromFields = (() => {
    if (kind === "starline") {
      const panna = displayPanna(session.open_panna);
      if (!panna) return null;
      const digit = displayDigit(session.open_digit) ?? "*";
      return `${panna}-${digit}`;
    }
    if (kind === "jackpot" || kind === "jodi") {
      const open = displayDigit(session.open_digit);
      const close = displayDigit(session.close_digit);
      if (open != null && close != null) return `${open}${close}`;
      return null;
    }
    // pana / main
    const op = displayPanna(session.open_panna);
    const cp = displayPanna(session.close_panna);
    const od = displayDigit(session.open_digit);
    const cd = displayDigit(session.close_digit);
    if (op == null && cp == null && od == null && cd == null) return null;
    const jodi =
      od != null && cd != null ? `${od}${cd}` : od != null ? od : cd != null ? cd : "**";
    return `${op ?? "***"}-${jodi}-${cp ?? "***"}`;
  })();

  const raw =
    fromFields ||
    field(session.game_result) ||
    field(session.result) ||
    field(session.resultData) ||
    "";

  return normalizeGameResultDisplay(raw, chartPlaceholder(kind));
}

export function buildWinBadges(result: string, kind: ChartKind): WinBadge[] {
  const placeholder = chartPlaceholder(kind);
  const normalized = normalizeGameResultDisplay(result, placeholder);

  const slots =
    kind === "starline"
      ? ["***", "*"]
      : kind === "jackpot" || kind === "jodi"
        ? ["**"]
        : ["***", "**", "***"];

  const parts =
    !normalized || normalized === "—"
      ? []
      : normalized.split("-").map((p) => p.trim());

  return slots.map((slotPlaceholder, index) => {
    const part = (parts[index] || "").replace(/_/g, "-");
    const isPlaceholder =
      !part ||
      part.split("").every((ch) => ch === "*" || ch === " " || ch === "-") ||
      !part.split("").some((ch) => ch >= "0" && ch <= "9");
    const text = isPlaceholder ? slotPlaceholder : part;
    const highlight =
      kind === "jackpot" || kind === "jodi"
        ? true
        : kind === "starline"
          ? index === 1
          : index === 1;
    return { text, isPlaceholder, highlight };
  });
}

export function parseChartDate(session: ChartSession): Dayjs | null {
  const raw =
    field(session.session_id) ||
    field(session.datetime)?.slice(0, 10) ||
    null;
  if (!raw) return null;
  const m = dayjs(raw.slice(0, 10), ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"], true);
  if (m.isValid()) return m.startOf("day");
  const fallback = dayjs(raw);
  return fallback.isValid() ? fallback.startOf("day") : null;
}

/** Flatten pana API weeks (array of arrays) into sessions. */
export function flattenAnkDetails(ankDetails: unknown): ChartSession[] {
  if (!Array.isArray(ankDetails)) return [];
  if (ankDetails.length === 0) return [];
  if (Array.isArray(ankDetails[0])) {
    return (ankDetails as ChartSession[][]).flat().filter(Boolean);
  }
  return ankDetails as ChartSession[];
}

export function sessionsToRows(kind: ChartKind, sessions: ChartSession[]): ChartResultRow[] {
  const mapped = sessions
    .map((session) => {
      const date = parseChartDate(session);
      if (!date) return null;
      return {
        date: date.format("YYYY-MM-DD"),
        result: formatChartSessionResult(kind, session),
        colour: session.colour ?? null,
      } satisfies ChartResultRow;
    })
    .filter(Boolean) as ChartResultRow[];

  // Keep latest declaration per day — no history cap (full database).
  const byDate = new Map<string, ChartResultRow>();
  for (const row of mapped) {
    byDate.set(row.date, row);
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function chartHistoryMeta(weeks: ChartWeekRow[]) {
  const declared = weeks.reduce(
    (sum, week) => sum + week.days.filter((d) => d != null).length,
    0,
  );
  const first = weeks[0]?.rangeStart ?? null;
  const last = weeks[weeks.length - 1]?.rangeEnd ?? null;
  return {
    weekCount: weeks.length,
    resultCount: declared,
    from: first,
    to: last,
  };
}

/** App-style ISO week grid (Mon–Sun), oldest → newest. */
export function buildWeekGrid(rows: ChartResultRow[]): ChartWeekRow[] {
  if (!rows.length) return [];

  const byDate = new Map(rows.map((r) => [r.date, r]));
  const dates = rows.map((r) => dayjs(r.date));
  let monday = dates.reduce((a, b) => (a.isBefore(b) ? a : b)).startOf("isoWeek");
  const endMonday = dates.reduce((a, b) => (a.isAfter(b) ? a : b)).startOf("isoWeek");

  const weeks: ChartWeekRow[] = [];
  while (!monday.isAfter(endMonday)) {
    const sunday = monday.add(6, "day");
    const days = Array.from({ length: 7 }, (_, i) => {
      const key = monday.add(i, "day").format("YYYY-MM-DD");
      return byDate.get(key) ?? null;
    });
    weeks.push({
      rangeStart: monday.format("YYYY-MM-DD"),
      rangeEnd: sunday.format("YYYY-MM-DD"),
      days,
    });
    monday = monday.add(7, "day");
  }
  return weeks;
}

export function formatWeekRangeLabel(start: string, end: string, compact = false): {
  primary: string;
  secondary: string;
} {
  const s = dayjs(start);
  const e = dayjs(end);
  const sameMonth = s.month() === e.month() && s.year() === e.year();
  if (compact) {
    return {
      primary: sameMonth ? `${s.date()}–${e.date()}` : `${s.date()} ${s.format("MMM")}`,
      secondary: sameMonth ? s.format("MMM") : `${e.date()} ${e.format("MMM")}`,
    };
  }
  return {
    primary: s.format("D MMM"),
    secondary: e.format("D MMM"),
  };
}

export function chartTitle(kind: ChartKind, name?: string | null): string {
  const base = name?.trim() || "Market";
  if (kind === "jodi") return `${base} · Jodi Chart`;
  if (kind === "pana") return `${base} · Pana Chart`;
  if (kind === "starline") return `${base} · Bombay Starline Chart`;
  return `${base} · Bombay Jackpot Chart`;
}
