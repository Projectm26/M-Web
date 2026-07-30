import type { ApiStatus } from "./types";

const OK = new Set(["001", "SUCCESS", "success"]);

export class WebsiteApiError extends Error {
  status?: ApiStatus;

  constructor(message: string, status?: ApiStatus) {
    super(message);
    this.name = "WebsiteApiError";
    this.status = status;
  }
}

export async function fetchJson<T extends object>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new WebsiteApiError(`Network error loading ${url}`);
  }
  if (!res.ok) {
    throw new WebsiteApiError(`Request failed (${res.status}) for ${url}`);
  }
  const data = (await res.json()) as T & { status?: ApiStatus; message?: string };
  if (!OK.has(String(data.status ?? ""))) {
    throw new WebsiteApiError(data.message || `API error for ${url}`, data.status);
  }
  return data;
}

export async function postJson<T extends object>(
  url: string,
  body: unknown,
): Promise<T> {
  return fetchJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
