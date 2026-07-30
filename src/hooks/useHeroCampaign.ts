import { useEffect, useState } from "react";
import {
  FALLBACK_HERO_CAMPAIGN,
  fetchHeroCampaignsConfig,
  resolveActiveCampaign,
  type HeroCampaign,
} from "../lib/heroCampaigns";

export function useHeroCampaign() {
  const [campaign, setCampaign] = useState<HeroCampaign>(FALLBACK_HERO_CAMPAIGN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const config = await fetchHeroCampaignsConfig();
      if (cancelled) return;
      setCampaign(resolveActiveCampaign(config));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { campaign, loading };
}
