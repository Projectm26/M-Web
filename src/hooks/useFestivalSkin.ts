import { useEffect, useState } from "react";
import { website } from "../config/api";
import { fetchJson } from "../lib/fetchWebsite";

export type FestivalSkinId = "diwali" | "ganesh" | "navratri" | "rakhi" | "shubh";

export interface FestivalSkin {
  id: FestivalSkinId;
  label: string | null;
  accent: string | null;
  frameUrl: string | null;
}

interface FestivalSkinApiResponse {
  status?: string;
  message?: string;
  festival_skin_enabled?: boolean | number | string;
  festival_skin_id?: string;
  festival_skin_starts_at?: string | null;
  festival_skin_ends_at?: string | null;
  festival_skin_label?: string | null;
  festival_skin_accent?: string | null;
  festival_skin_frame_url?: string | null;
}

const KNOWN = new Set<string>(["diwali", "ganesh", "navratri", "rakhi", "shubh"]);

const CATALOG_ACCENT: Record<FestivalSkinId, string> = {
  diwali: "#D4A017",
  ganesh: "#E07020",
  navratri: "#B83B5E",
  rakhi: "#C75B7A",
  shubh: "#A63D2F",
};

let cachedPromise: Promise<FestivalSkin | null> | null = null;

function asOn(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

/** Today as YYYY-MM-DD in Asia/Kolkata. */
export function todayIstYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function resolveActive(raw: FestivalSkinApiResponse | null): FestivalSkin | null {
  if (!raw || !asOn(raw.festival_skin_enabled)) return null;
  const id = String(raw.festival_skin_id || "")
    .trim()
    .toLowerCase();
  if (!KNOWN.has(id)) return null;
  const today = todayIstYmd();
  const start = (raw.festival_skin_starts_at || "").trim().slice(0, 10);
  const end = (raw.festival_skin_ends_at || "").trim().slice(0, 10);
  if (start && today < start) return null;
  if (end && today > end) return null;
  return {
    id: id as FestivalSkinId,
    label: raw.festival_skin_label?.trim() || null,
    accent: raw.festival_skin_accent?.trim() || CATALOG_ACCENT[id as FestivalSkinId],
    frameUrl: raw.festival_skin_frame_url?.trim() || null,
  };
}

function loadFestivalSkin(): Promise<FestivalSkin | null> {
  if (!cachedPromise) {
    cachedPromise = fetchJson<FestivalSkinApiResponse>(website.festivalSkin)
      .then((res) => resolveActive(res))
      .catch(() => null);
  }
  return cachedPromise;
}

export function useFestivalSkin(): FestivalSkin | null {
  const [skin, setSkin] = useState<FestivalSkin | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFestivalSkin().then((next) => {
      if (!cancelled) setSkin(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!skin) {
      root.removeAttribute("data-festival");
      root.style.removeProperty("--festival-accent");
      return;
    }
    root.setAttribute("data-festival", skin.id);
    root.style.setProperty("--festival-accent", skin.accent || CATALOG_ACCENT[skin.id]);
    return () => {
      root.removeAttribute("data-festival");
      root.style.removeProperty("--festival-accent");
    };
  }, [skin]);

  return skin;
}
