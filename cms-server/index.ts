import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  DATA_DIR,
  UPLOADS_DIR,
  deleteCampaign,
  getCampaign,
  getDefaultCampaignId,
  listCampaigns,
  openDb,
  setDefaultCampaignId,
  upsertCampaign,
  type CampaignDto,
} from "./db.ts";

/** Load KEY=VAL from web/.env and web/.env.local (no dotenv dep). */
function loadEnvFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const name of [".env", ".env.local"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadEnvFiles();

const isProd = process.env.NODE_ENV === "production";
/** Railway injects PORT; local CMS uses CMS_PORT (default 8787). */
const PORT = Number(process.env.PORT || process.env.CMS_PORT || (isProd ? 3000 : 8787));
const HOST = process.env.HOST || (isProd ? "0.0.0.0" : "127.0.0.1");
const ACCESS_KEY = process.env.CMS_ACCESS_KEY || "";
const DIST_DIR = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "dist",
);
const serveSpa = isProd || process.env.SERVE_SPA === "true";

const db = openDb();
const app = new Hono();

app.use("/cms-api/*", cors({ origin: "*" }));

function requireKey(c: { req: { header: (n: string) => string | undefined } }) {
  if (!ACCESS_KEY) {
    return { ok: false as const, status: 503 as const, message: "CMS_ACCESS_KEY is not configured" };
  }
  const key = c.req.header("x-cms-key") || c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!key || key !== ACCESS_KEY) {
    return { ok: false as const, status: 401 as const, message: "Invalid CMS access key" };
  }
  return { ok: true as const };
}

function parseCampaignBody(body: Record<string, unknown>, idFallback?: string): CampaignDto | null {
  const id = String(body.id || idFallback || "").trim();
  if (!id) return null;
  const layout = body.layout === "image" ? "image" : "phone";
  return {
    id,
    active: Boolean(body.active),
    startsAt: body.startsAt == null || body.startsAt === "" ? null : String(body.startsAt),
    endsAt: body.endsAt == null || body.endsAt === "" ? null : String(body.endsAt),
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0,
    kicker: String(body.kicker ?? ""),
    brand: String(body.brand ?? "Shubh555"),
    tagline: String(body.tagline ?? ""),
    ctaLabel: String(body.ctaLabel ?? "Download Official App"),
    showSupportLinks: body.showSupportLinks !== false,
    backgroundImage: String(body.backgroundImage || ""),
    objectPosition: body.objectPosition ? String(body.objectPosition) : undefined,
    layout,
    watermark: Array.isArray(body.watermark) ? body.watermark.map(String) : undefined,
    phonePreview:
      body.phonePreview && typeof body.phonePreview === "object"
        ? (body.phonePreview as CampaignDto["phonePreview"])
        : undefined,
  };
}

const api = new Hono();

api.get("/public/hero", (c) =>
  c.json({
    defaultCampaignId: getDefaultCampaignId(db),
    campaigns: listCampaigns(db),
  }),
);

api.get("/health", (c) => c.json({ ok: true, authConfigured: Boolean(ACCESS_KEY) }));

api.post("/auth/verify", (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, auth.status);
  return c.json({ ok: true });
});

api.get("/settings", (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  return c.json({ defaultCampaignId: getDefaultCampaignId(db) });
});

api.put("/settings", async (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  const body = (await c.req.json()) as { defaultCampaignId?: string };
  const id = String(body.defaultCampaignId || "").trim();
  if (!id) return c.json({ message: "defaultCampaignId required" }, 400);
  if (!getCampaign(db, id)) return c.json({ message: "Campaign not found" }, 404);
  setDefaultCampaignId(db, id);
  return c.json({ defaultCampaignId: id });
});

api.get("/campaigns", (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  return c.json({
    defaultCampaignId: getDefaultCampaignId(db),
    campaigns: listCampaigns(db),
  });
});

api.get("/campaigns/:id", (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  const row = getCampaign(db, c.req.param("id"));
  if (!row) return c.json({ message: "Not found" }, 404);
  return c.json(row);
});

api.post("/campaigns", async (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  const body = (await c.req.json()) as Record<string, unknown>;
  const campaign = parseCampaignBody(body);
  if (!campaign) return c.json({ message: "id required" }, 400);
  if (!campaign.backgroundImage) return c.json({ message: "backgroundImage required" }, 400);
  if (getCampaign(db, campaign.id)) return c.json({ message: "Campaign id already exists" }, 409);
  upsertCampaign(db, campaign, true);
  return c.json(getCampaign(db, campaign.id), 201);
});

api.put("/campaigns/:id", async (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  const id = c.req.param("id");
  if (!getCampaign(db, id)) return c.json({ message: "Not found" }, 404);
  const body = (await c.req.json()) as Record<string, unknown>;
  const campaign = parseCampaignBody({ ...body, id }, id);
  if (!campaign) return c.json({ message: "Invalid body" }, 400);
  if (!campaign.backgroundImage) return c.json({ message: "backgroundImage required" }, 400);
  upsertCampaign(db, campaign, false);
  return c.json(getCampaign(db, id));
});

api.delete("/campaigns/:id", (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);
  const id = c.req.param("id");
  if (!getCampaign(db, id)) return c.json({ message: "Not found" }, 404);
  deleteCampaign(db, id);
  if (getDefaultCampaignId(db) === id) {
    const next = listCampaigns(db)[0];
    if (next) setDefaultCampaignId(db, next.id);
  }
  return c.json({ ok: true });
});

api.post("/upload", async (c) => {
  const auth = requireKey(c);
  if (!auth.ok) return c.json({ message: auth.message }, auth.status);

  const form = await c.req.parseBody();
  const file = form.file;
  if (!file || typeof file === "string") {
    return c.json({ message: "file required" }, 400);
  }

  const name = file.name || "upload.jpg";
  const ext = path.extname(name).toLowerCase() || ".jpg";
  if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return c.json({ message: "Only jpg, png, webp, gif allowed" }, 400);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) {
    return c.json({ message: "Max file size 8MB" }, 400);
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
  return c.json({ url: `/cms-media/heroes/${filename}` });
});

app.route("/cms-api", api);

app.get("/cms-media/heroes/:file", (c) => {
  const file = path.basename(c.req.param("file"));
  const full = path.join(UPLOADS_DIR, file);
  if (!full.startsWith(UPLOADS_DIR) || !fs.existsSync(full)) {
    return c.json({ message: "Not found" }, 404);
  }
  const ext = path.extname(file).toLowerCase();
  const type =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  return new Response(fs.readFileSync(full), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
});

/** Liveness for Railway / Docker (no auth). */
app.get("/healthz", (c) =>
  c.json({
    ok: true,
    service: "shubh555-web",
    spa: serveSpa && fs.existsSync(path.join(DIST_DIR, "index.html")),
    cmsAuthConfigured: Boolean(ACCESS_KEY),
  }),
);

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".map":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

function safeJoin(root: string, reqPath: string): string | null {
  const decoded = decodeURIComponent(reqPath.split("?")[0] || "/");
  const rel = decoded.replace(/^\/+/, "");
  const full = path.normalize(path.join(root, rel));
  if (!full.startsWith(path.normalize(root))) return null;
  return full;
}

if (serveSpa) {
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
    console.warn(`[web] SERVE_SPA/production but missing ${path.join(DIST_DIR, "index.html")}`);
  }

  app.get("*", (c) => {
    const urlPath = new URL(c.req.url).pathname;
    // Never hijack CMS API / media (already handled above if matched).
    if (urlPath.startsWith("/cms-api") || urlPath.startsWith("/cms-media") || urlPath === "/healthz") {
      return c.json({ message: "Not found" }, 404);
    }

    const filePath = safeJoin(DIST_DIR, urlPath === "/" ? "/index.html" : urlPath);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const body = fs.readFileSync(filePath);
      const isAsset = urlPath.startsWith("/assets/");
      return new Response(body, {
        headers: {
          "Content-Type": contentTypeFor(filePath),
          "Cache-Control": isAsset ? "public, max-age=31536000, immutable" : "public, max-age=60",
        },
      });
    }

    // SPA fallback for /chart, /cms, etc.
    const indexPath = path.join(DIST_DIR, "index.html");
    if (!fs.existsSync(indexPath)) {
      return c.text("Web build missing (dist/index.html). Run npm run build.", 503);
    }
    return new Response(fs.readFileSync(indexPath), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  });
}

if (!ACCESS_KEY) {
  console.warn("[cms] WARNING: CMS_ACCESS_KEY is empty — admin routes will return 503");
}

console.log(`[cms] data dir ${DATA_DIR}`);
console.log(`[web] listening on http://${HOST}:${PORT} (spa=${serveSpa})`);
console.log(`[cms] public hero: GET /cms-api/public/hero`);
console.log(`[web] health: GET /healthz`);

serve({ fetch: app.fetch, port: PORT, hostname: HOST });
