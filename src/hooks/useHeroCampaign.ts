import { useEffect, useState } from "react";
import {
  FALLBACK_HERO_CAMPAIGN,
  fetchHeroCampaignsConfig,
  resolveActiveCampaigns,
  type HeroCampaign,
} from "../lib/heroCampaigns";

export function useHeroCampaigns() {
  const [campaigns, setCampaigns] = useState<HeroCampaign[]>([FALLBACK_HERO_CAMPAIGN]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const config = await fetchHeroCampaignsConfig();
      if (cancelled) return;
      setCampaigns(resolveActiveCampaigns(config));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { campaigns, loading };
}

/** @deprecated Prefer useHeroCampaigns for the slider. */
export function useHeroCampaign() {
  const { campaigns, loading } = useHeroCampaigns();
  return { campaign: campaigns[0] || FALLBACK_HERO_CAMPAIGN, loading };
}
