import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const WEB_ROOT = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(WEB_ROOT, "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads", "heroes");
export const DB_PATH = path.join(DATA_DIR, "cms.sqlite");
const SEED_JSON = path.join(WEB_ROOT, "public", "hero-campaigns.json");

export type DbCampaignRow = {
  id: string;
  active: number;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  kicker: string;
  brand: string;
  tagline: string;
  cta_label: string;
  show_support_links: number;
  background_image: string;
  object_position: string | null;
  layout: string;
  watermark_json: string | null;
  phone_preview_json: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignDto = {
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
  layout: "phone" | "image";
  watermark?: string[];
  phonePreview?: { rows: Array<{ label: string; result: string; tone?: string }> };
};

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function rowToCampaign(row: DbCampaignRow): CampaignDto {
  let watermark: string[] | undefined;
  let phonePreview: CampaignDto["phonePreview"];
  try {
    watermark = row.watermark_json ? (JSON.parse(row.watermark_json) as string[]) : undefined;
  } catch {
    watermark = undefined;
  }
  try {
    phonePreview = row.phone_preview_json
      ? (JSON.parse(row.phone_preview_json) as CampaignDto["phonePreview"])
      : undefined;
  } catch {
    phonePreview = undefined;
  }
  return {
    id: row.id,
    active: Boolean(row.active),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priority: row.priority,
    kicker: row.kicker,
    brand: row.brand,
    tagline: row.tagline,
    ctaLabel: row.cta_label,
    showSupportLinks: Boolean(row.show_support_links),
    backgroundImage: row.background_image,
    objectPosition: row.object_position || undefined,
    layout: row.layout === "image" ? "image" : "phone",
    watermark,
    phonePreview,
  };
}

export function openDb() {
  ensureDirs();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS hero_campaigns (
      id TEXT PRIMARY KEY,
      active INTEGER NOT NULL DEFAULT 1,
      starts_at TEXT,
      ends_at TEXT,
      priority INTEGER NOT NULL DEFAULT 0,
      kicker TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL DEFAULT 'Shubh555',
      tagline TEXT NOT NULL DEFAULT '',
      cta_label TEXT NOT NULL DEFAULT 'Download Official App',
      show_support_links INTEGER NOT NULL DEFAULT 1,
      background_image TEXT NOT NULL,
      object_position TEXT,
      layout TEXT NOT NULL DEFAULT 'phone',
      watermark_json TEXT,
      phone_preview_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cms_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const count = db.prepare("SELECT COUNT(*) AS c FROM hero_campaigns").get() as { c: number };
  if (count.c === 0) {
    seedFromJson(db);
  }

  const def = db.prepare("SELECT value FROM cms_settings WHERE key = ?").get("default_campaign_id") as
    | { value: string }
    | undefined;
  if (!def) {
    const first = db.prepare("SELECT id FROM hero_campaigns ORDER BY priority DESC LIMIT 1").get() as
      | { id: string }
      | undefined;
    db.prepare("INSERT INTO cms_settings (key, value) VALUES (?, ?)").run(
      "default_campaign_id",
      first?.id || "sunset-boards",
    );
  }

  return db;
}

function seedFromJson(db: InstanceType<typeof Database>) {
  let campaigns: CampaignDto[] = [];
  let defaultCampaignId = "sunset-boards";
  try {
    if (fs.existsSync(SEED_JSON)) {
      const raw = JSON.parse(fs.readFileSync(SEED_JSON, "utf8")) as {
        defaultCampaignId?: string;
        campaigns?: CampaignDto[];
      };
      defaultCampaignId = raw.defaultCampaignId || defaultCampaignId;
      campaigns = Array.isArray(raw.campaigns) ? raw.campaigns : [];
    }
  } catch {
    campaigns = [];
  }

  if (!campaigns.length) {
    campaigns = [
      {
        id: "sunset-boards",
        active: true,
        startsAt: "2026-07-01",
        endsAt: null,
        priority: 10,
        kicker: "Declared results · Daily markets",
        brand: "Shubh555",
        tagline:
          "Today's open–close boards on the web. Play Main, Night, Starline & Lottery in the official app.",
        ctaLabel: "Download Official App",
        showSupportLinks: true,
        backgroundImage: "/media/heroes/sunset.jpg",
        objectPosition: "62% 40%",
        layout: "phone",
        watermark: ["4", "8", "2"],
        phonePreview: {
          rows: [
            { label: "Kalyan", result: "482-49", tone: "main" },
            { label: "Starline", result: "7", tone: "starline" },
            { label: "Jackpot", result: "39", tone: "jackpot" },
          ],
        },
      },
    ];
  }

  const insert = db.prepare(`
    INSERT INTO hero_campaigns (
      id, active, starts_at, ends_at, priority, kicker, brand, tagline, cta_label,
      show_support_links, background_image, object_position, layout,
      watermark_json, phone_preview_json, created_at, updated_at
    ) VALUES (
      @id, @active, @starts_at, @ends_at, @priority, @kicker, @brand, @tagline, @cta_label,
      @show_support_links, @background_image, @object_position, @layout,
      @watermark_json, @phone_preview_json, @created_at, @updated_at
    )
  `);

  const now = new Date().toISOString();
  const tx = db.transaction((items: CampaignDto[]) => {
    for (const c of items) {
      insert.run({
        id: c.id,
        active: c.active ? 1 : 0,
        starts_at: c.startsAt,
        ends_at: c.endsAt,
        priority: c.priority ?? 0,
        kicker: c.kicker ?? "",
        brand: c.brand ?? "Shubh555",
        tagline: c.tagline ?? "",
        cta_label: c.ctaLabel ?? "Download Official App",
        show_support_links: c.showSupportLinks === false ? 0 : 1,
        background_image: c.backgroundImage,
        object_position: c.objectPosition ?? null,
        layout: c.layout === "image" ? "image" : "phone",
        watermark_json: c.watermark ? JSON.stringify(c.watermark) : null,
        phone_preview_json: c.phonePreview ? JSON.stringify(c.phonePreview) : null,
        created_at: now,
        updated_at: now,
      });
    }
    db.prepare(
      "INSERT OR REPLACE INTO cms_settings (key, value) VALUES ('default_campaign_id', ?)",
    ).run(defaultCampaignId);
  });
  tx(campaigns);
}

export function listCampaigns(db: InstanceType<typeof Database>): CampaignDto[] {
  const rows = db
    .prepare("SELECT * FROM hero_campaigns ORDER BY priority DESC, id ASC")
    .all() as DbCampaignRow[];
  return rows.map(rowToCampaign);
}

export function getCampaign(db: InstanceType<typeof Database>, id: string): CampaignDto | null {
  const row = db.prepare("SELECT * FROM hero_campaigns WHERE id = ?").get(id) as
    | DbCampaignRow
    | undefined;
  return row ? rowToCampaign(row) : null;
}

export function getDefaultCampaignId(db: InstanceType<typeof Database>): string {
  const row = db.prepare("SELECT value FROM cms_settings WHERE key = ?").get("default_campaign_id") as
    | { value: string }
    | undefined;
  return row?.value || "sunset-boards";
}

export function setDefaultCampaignId(db: InstanceType<typeof Database>, id: string) {
  db.prepare("INSERT OR REPLACE INTO cms_settings (key, value) VALUES (?, ?)").run(
    "default_campaign_id",
    id,
  );
}

export function upsertCampaign(db: InstanceType<typeof Database>, campaign: CampaignDto, isNew: boolean) {
  const now = new Date().toISOString();
  if (isNew) {
    db.prepare(`
      INSERT INTO hero_campaigns (
        id, active, starts_at, ends_at, priority, kicker, brand, tagline, cta_label,
        show_support_links, background_image, object_position, layout,
        watermark_json, phone_preview_json, created_at, updated_at
      ) VALUES (
        @id, @active, @starts_at, @ends_at, @priority, @kicker, @brand, @tagline, @cta_label,
        @show_support_links, @background_image, @object_position, @layout,
        @watermark_json, @phone_preview_json, @created_at, @updated_at
      )
    `).run({
      id: campaign.id,
      active: campaign.active ? 1 : 0,
      starts_at: campaign.startsAt,
      ends_at: campaign.endsAt,
      priority: campaign.priority,
      kicker: campaign.kicker,
      brand: campaign.brand,
      tagline: campaign.tagline,
      cta_label: campaign.ctaLabel,
      show_support_links: campaign.showSupportLinks ? 1 : 0,
      background_image: campaign.backgroundImage,
      object_position: campaign.objectPosition ?? null,
      layout: campaign.layout,
      watermark_json: campaign.watermark ? JSON.stringify(campaign.watermark) : null,
      phone_preview_json: campaign.phonePreview ? JSON.stringify(campaign.phonePreview) : null,
      created_at: now,
      updated_at: now,
    });
  } else {
    db.prepare(`
      UPDATE hero_campaigns SET
        active = @active,
        starts_at = @starts_at,
        ends_at = @ends_at,
        priority = @priority,
        kicker = @kicker,
        brand = @brand,
        tagline = @tagline,
        cta_label = @cta_label,
        show_support_links = @show_support_links,
        background_image = @background_image,
        object_position = @object_position,
        layout = @layout,
        watermark_json = @watermark_json,
        phone_preview_json = @phone_preview_json,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: campaign.id,
      active: campaign.active ? 1 : 0,
      starts_at: campaign.startsAt,
      ends_at: campaign.endsAt,
      priority: campaign.priority,
      kicker: campaign.kicker,
      brand: campaign.brand,
      tagline: campaign.tagline,
      cta_label: campaign.ctaLabel,
      show_support_links: campaign.showSupportLinks ? 1 : 0,
      background_image: campaign.backgroundImage,
      object_position: campaign.objectPosition ?? null,
      layout: campaign.layout,
      watermark_json: campaign.watermark ? JSON.stringify(campaign.watermark) : null,
      phone_preview_json: campaign.phonePreview ? JSON.stringify(campaign.phonePreview) : null,
      updated_at: now,
    });
  }
}

export function deleteCampaign(db: InstanceType<typeof Database>, id: string) {
  db.prepare("DELETE FROM hero_campaigns WHERE id = ?").run(id);
}
