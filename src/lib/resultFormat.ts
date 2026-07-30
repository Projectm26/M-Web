/** Normalize market result for display — ASCII hyphens only (xxx-xx-xxx). */
export function normalizeGameResultDisplay(
  value?: string | null,
  fallback = "***-**-***",
): string {
  if (value == null || !String(value).trim()) return fallback;
  const cleaned = String(value)
    .trim()
    // Underscores and dash-like chars → hyphen (never show xxx_xx_xxx)
    .replace(/_/g, "-")
    .replace(/[\uFF3F\u2017\u02CD\u0331\u0332\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/** True when value looks like a declared digit/pana board (not a status sentence). */
export function isDigitResult(value?: string | null): boolean {
  if (value == null) return false;
  const t = normalizeGameResultDisplay(value, "");
  if (!t) return false;
  return /^[\d*\s-]+$/.test(t);
}

export type MarketResultKind = "main" | "starline" | "jackpot";

export function resultFallback(kind: MarketResultKind = "main"): string {
  if (kind === "starline") return "***-*";
  if (kind === "jackpot") return "**";
  return "***-**-***";
}
