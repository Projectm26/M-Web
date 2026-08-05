const KEY_STORAGE = "shubh555-cms-key";

export function getCmsKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setCmsKey(key: string) {
  sessionStorage.setItem(KEY_STORAGE, key);
}

export function clearCmsKey() {
  sessionStorage.removeItem(KEY_STORAGE);
}

export class CmsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function cmsFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const key = getCmsKey();
  if (key) headers.set("x-cms-key", key);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(`/cms-api${path}`, { ...init, headers });
  } catch {
    throw new CmsApiError(
      "CMS unreachable. Locally run `npm run dev:all` (Vite + CMS). On Railway check /healthz and CMS_ACCESS_KEY.",
      0,
    );
  }
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new CmsApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export type CmsCampaign = {
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

export async function verifyCmsKey(key: string) {
  const res = await fetch("/cms-api/auth/verify", {
    method: "POST",
    headers: { "x-cms-key": key },
  });
  const data = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !data.ok) {
    throw new CmsApiError(data.message || "Invalid key", res.status);
  }
}

export function listCampaigns() {
  return cmsFetch<{ defaultCampaignId: string; campaigns: CmsCampaign[] }>("/campaigns");
}

export function getCampaign(id: string) {
  return cmsFetch<CmsCampaign>(`/campaigns/${encodeURIComponent(id)}`);
}

export function createCampaign(body: CmsCampaign) {
  return cmsFetch<CmsCampaign>("/campaigns", { method: "POST", body: JSON.stringify(body) });
}

export function updateCampaign(id: string, body: CmsCampaign) {
  return cmsFetch<CmsCampaign>(`/campaigns/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function removeCampaign(id: string) {
  return cmsFetch<{ ok: boolean }>(`/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function setDefaultCampaign(defaultCampaignId: string) {
  return cmsFetch<{ defaultCampaignId: string }>("/settings", {
    method: "PUT",
    body: JSON.stringify({ defaultCampaignId }),
  });
}

export async function uploadHeroImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return cmsFetch<{ url: string }>("/upload", { method: "POST", body: form });
}
