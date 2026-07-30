export type HeroLayout = "phone" | "image";

export type HeroPhoneTone = "main" | "starline" | "jackpot" | "night";

export interface HeroPhoneRow {
  label: string;
  result: string;
  tone?: HeroPhoneTone;
}

export interface HeroCampaign {
  id: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  kicker: string;
  brand: string;
  tagline: string;
  ctaLabel: string;
  showSupportLinks: boolean;
  backgroundImage: string;
  objectPosition?: string;
  layout: HeroLayout;
  watermark?: string[];
  phonePreview?: {
    rows: HeroPhoneRow[];
  };
}

export interface HeroCampaignsConfig {
  defaultCampaignId: string;
  campaigns: HeroCampaign[];
}

/** Built-in fallback if JSON is missing or invalid. */
export const FALLBACK_HERO_CAMPAIGN: HeroCampaign = {
  id: "board-light",
  active: true,
  startsAt: "2026-07-01",
  endsAt: null,
  priority: 10,
  kicker: "",
  brand: "Shubh555",
  tagline: "Live open–close boards. Play in the official app.",
  ctaLabel: "Get the App",
  showSupportLinks: false,
  backgroundImage: "/media/heroes/sunset.jpg",
  objectPosition: "58% 38%",
  layout: "image",
  watermark: [],
  phonePreview: {
    rows: [
      { label: "Kalyan", result: "482-49", tone: "main" },
      { label: "Starline", result: "7", tone: "starline" },
      { label: "Jackpot", result: "39", tone: "jackpot" },
    ],
  },
};

const FALLBACK_CONFIG: HeroCampaignsConfig = {
  defaultCampaignId: FALLBACK_HERO_CAMPAIGN.id,
  campaigns: [FALLBACK_HERO_CAMPAIGN],
};

function parseDay(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(`${iso}T00:00:00`);
  return Number.isFinite(t) ? t : null;
}

function isInWindow(campaign: HeroCampaign, todayMs: number): boolean {
  const start = parseDay(campaign.startsAt);
  const end = parseDay(campaign.endsAt);
  if (start != null && todayMs < start) return false;
  if (end != null && todayMs > end + 24 * 60 * 60 * 1000 - 1) return false;
  return true;
}

function normalizeCampaign(raw: Partial<HeroCampaign> | null | undefined): HeroCampaign | null {
  if (!raw || typeof raw.id !== "string" || !raw.id.trim()) return null;
  const layout = raw.layout === "image" ? "image" : "phone";
  return {
    ...FALLBACK_HERO_CAMPAIGN,
    ...raw,
    id: raw.id.trim(),
    active: Boolean(raw.active),
    startsAt: raw.startsAt ?? null,
    endsAt: raw.endsAt ?? null,
    priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0,
    kicker: String(raw.kicker ?? FALLBACK_HERO_CAMPAIGN.kicker),
    brand: String(raw.brand ?? FALLBACK_HERO_CAMPAIGN.brand),
    tagline: String(raw.tagline ?? FALLBACK_HERO_CAMPAIGN.tagline),
    ctaLabel: String(raw.ctaLabel ?? FALLBACK_HERO_CAMPAIGN.ctaLabel),
    showSupportLinks: raw.showSupportLinks !== false,
    backgroundImage: String(raw.backgroundImage || FALLBACK_HERO_CAMPAIGN.backgroundImage),
    objectPosition: raw.objectPosition || FALLBACK_HERO_CAMPAIGN.objectPosition,
    layout,
    watermark: Array.isArray(raw.watermark) ? raw.watermark.map(String) : FALLBACK_HERO_CAMPAIGN.watermark,
    phonePreview: raw.phonePreview?.rows?.length
      ? {
          rows: raw.phonePreview.rows.map((row) => ({
            label: String(row.label ?? ""),
            result: String(row.result ?? "---"),
            tone: row.tone,
          })),
        }
      : FALLBACK_HERO_CAMPAIGN.phonePreview,
  };
}

export function normalizeHeroCampaignsConfig(raw: unknown): HeroCampaignsConfig {
  if (!raw || typeof raw !== "object") return FALLBACK_CONFIG;
  const data = raw as Partial<HeroCampaignsConfig>;
  const campaigns = Array.isArray(data.campaigns)
    ? data.campaigns.map(normalizeCampaign).filter((c): c is HeroCampaign => c != null)
    : [];
  if (!campaigns.length) return FALLBACK_CONFIG;
  const defaultCampaignId =
    typeof data.defaultCampaignId === "string" && data.defaultCampaignId
      ? data.defaultCampaignId
      : campaigns[0].id;
  return { defaultCampaignId, campaigns };
}

/**
 * Among active campaigns in date window, pick highest priority.
 * If none match, use defaultCampaignId (or first campaign).
 */
export function resolveActiveCampaign(
  config: HeroCampaignsConfig,
  today: Date = new Date(),
): HeroCampaign {
  const todayMs = Date.parse(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T12:00:00`,
  );

  const eligible = config.campaigns
    .filter((c) => c.active && isInWindow(c, todayMs))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  if (eligible.length) return eligible[0];

  const fallback =
    config.campaigns.find((c) => c.id === config.defaultCampaignId) ||
    config.campaigns[0] ||
    FALLBACK_HERO_CAMPAIGN;
  return fallback;
}

export async function fetchHeroCampaignsConfig(): Promise<HeroCampaignsConfig> {
  // Prefer local CMS when running; fall back to static JSON.
  try {
    const cmsRes = await fetch("/cms-api/public/hero", { cache: "no-cache" });
    if (cmsRes.ok) {
      const json: unknown = await cmsRes.json();
      return normalizeHeroCampaignsConfig(json);
    }
  } catch {
    /* CMS offline */
  }

  try {
    const res = await fetch("/hero-campaigns.json", { cache: "no-cache" });
    if (!res.ok) return FALLBACK_CONFIG;
    const json: unknown = await res.json();
    return normalizeHeroCampaignsConfig(json);
  } catch {
    return FALLBACK_CONFIG;
  }
}
