import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);

export { dayjs };

/** Format `HH:mm:ss` → `hh:mm A` */
export function formatClock(time?: string | null, fallback = "---"): string {
  if (!time) return fallback;
  const m = dayjs(time, ["HH:mm:ss", "hh:mm A", "h:mm A"], true);
  return m.isValid() ? m.format("hh:mm A").toUpperCase() : fallback;
}

/**
 * Pick the timed game (starline/jackpot) that should show now —
 * switches to the next slot 5 minutes before its result time.
 */
export function pickCurrentTimedGame<T extends { result_time: string }>(
  games: T[],
): T | null {
  if (!games.length) return null;

  const now = dayjs();
  const sorted = [...games].sort(
    (a, b) =>
      dayjs(a.result_time, "HH:mm:ss").valueOf() -
      dayjs(b.result_time, "HH:mm:ss").valueOf(),
  );

  let current = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length; i++) {
    const gameTime = dayjs(sorted[i].result_time, "HH:mm:ss");
    const fiveBefore = gameTime.subtract(5, "minute");

    if (now.isBefore(fiveBefore)) {
      if (i > 0) current = sorted[i - 1];
      break;
    }
    if (now.isSameOrAfter(fiveBefore)) {
      current = sorted[i];
    }
  }

  return current;
}

export function stripTimeFromName(name?: string, fallback = "Bombay Jackpot"): string {
  if (!name) return fallback;
  const cleaned = name.replace(/\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/gi, "").trim();
  return cleaned || fallback;
}
