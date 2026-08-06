export type HeroLayout = "phone" | "image";

export type HeroPhoneTone = "main" | "starline" | "jackpot" | "night";

export type HeroTextAlign = "left" | "center" | "right";

export type HeroCtaAction = "download" | "link" | "whatsapp" | "none";

export type HeroCtaStyle = "solid" | "outline" | "soft";

export interface HeroPhoneRow {
  label: string;
  result: string;
  tone?: HeroPhoneTone;
}

/** Visual / UX controls for the public hero. */
export interface HeroDesign {
  showKicker: boolean;
  showBrand: boolean;
  showTagline: boolean;
  showCta: boolean;
  showSupport: boolean;
  /** Dark wash over the photo, 0–100. */
  overlayOpacity: number;
  textAlign: HeroTextAlign;
  ctaAction: HeroCtaAction;
  /** Used when ctaAction is "link". */
  ctaUrl: string;
  ctaStyle: HeroCtaStyle;
}

export const DEFAULT_HERO_DESIGN: HeroDesign = {
  showKicker: false,
  showBrand: true,
  showTagline: true,
  showCta: true,
  showSupport: false,
  overlayOpacity: 72,
  textAlign: "left",
  ctaAction: "download",
  ctaUrl: "",
  ctaStyle: "solid",
};

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
  /** @deprecated prefer design.showSupport — kept for older rows */
  showSupportLinks: boolean;
  backgroundImage: string;
  objectPosition?: string;
  layout: HeroLayout;
  watermark?: string[];
  phonePreview?: {
    rows: HeroPhoneRow[];
  };
  design: HeroDesign;
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
  tagline: "Live satta open–close. Bid in the official app.",
  ctaLabel: "Download App",
  showSupportLinks: false,
  backgroundImage: "/media/heroes/sunset.jpg",
  objectPosition: "58% 38%",
  layout: "image",
  watermark: [],
  phonePreview: {
    rows: [
      { label: "Kalyan", result: "482-49", tone: "main" },
      { label: "Bombay Starline", result: "7", tone: "starline" },
      { label: "Bombay Jackpot", result: "39", tone: "jackpot" },
    ],
  },
  design: { ...DEFAULT_HERO_DESIGN },
};

const FALLBACK_CONFIG: HeroCampaignsConfig = {
  defaultCampaignId: FALLBACK_HERO_CAMPAIGN.id,
  campaigns: [FALLBACK_HERO_CAMPAIGN],
};

function clampOpacity(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return DEFAULT_HERO_DESIGN.overlayOpacity;
  return Math.min(100, Math.max(0, Math.round(v)));
}

export function normalizeHeroDesign(
  raw: Partial<HeroDesign> | null | undefined,
  legacyShowSupport?: boolean,
): HeroDesign {
  const base = { ...DEFAULT_HERO_DESIGN };
  if (legacyShowSupport != null) base.showSupport = Boolean(legacyShowSupport);
  if (!raw || typeof raw !== "object") return base;

  const textAlign =
    raw.textAlign === "center" || raw.textAlign === "right" ? raw.textAlign : "left";
  const ctaAction =
    raw.ctaAction === "link" ||
    raw.ctaAction === "whatsapp" ||
    raw.ctaAction === "none" ||
    raw.ctaAction === "download"
      ? raw.ctaAction
      : "download";
  const ctaStyle =
    raw.ctaStyle === "outline" || raw.ctaStyle === "soft" ? raw.ctaStyle : "solid";

  return {
    showKicker: raw.showKicker ?? base.showKicker,
    showBrand: raw.showBrand ?? base.showBrand,
    showTagline: raw.showTagline ?? base.showTagline,
    showCta: raw.showCta ?? base.showCta,
    showSupport: raw.showSupport ?? base.showSupport,
    overlayOpacity: clampOpacity(raw.overlayOpacity ?? base.overlayOpacity),
    textAlign,
    ctaAction,
    ctaUrl: String(raw.ctaUrl ?? ""),
    ctaStyle,
  };
}

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
  const design = normalizeHeroDesign(raw.design, raw.showSupportLinks);
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
    showSupportLinks: design.showSupport,
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
    design,
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
 * All active campaigns in date window, highest priority first.
 * Disabled (`active: false`) banners are excluded from the site slider.
 * If none are eligible, falls back to the default campaign only.
 */
export function resolveActiveCampaigns(
  config: HeroCampaignsConfig,
  today: Date = new Date(),
): HeroCampaign[] {
  const todayMs = Date.parse(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T12:00:00`,
  );

  const eligible = config.campaigns
    .filter((c) => c.active && isInWindow(c, todayMs))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  if (eligible.length) return eligible;

  const fallback =
    config.campaigns.find((c) => c.id === config.defaultCampaignId) ||
    config.campaigns[0] ||
    FALLBACK_HERO_CAMPAIGN;
  return [fallback];
}

/** @deprecated Prefer resolveActiveCampaigns for the multi-banner slider. */
export function resolveActiveCampaign(
  config: HeroCampaignsConfig,
  today: Date = new Date(),
): HeroCampaign {
  return resolveActiveCampaigns(config, today)[0] || FALLBACK_HERO_CAMPAIGN;
}

export async function fetchHeroCampaignsConfig(): Promise<HeroCampaignsConfig> {
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
