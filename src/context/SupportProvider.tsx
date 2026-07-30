import { useEffect, useMemo, useState, type ReactNode } from "react";
import { website } from "../config/api";
import { fetchJson } from "../lib/fetchWebsite";
import type { SupportInfo } from "../lib/types";
import { SupportContext } from "./support-context";

export function SupportProvider({ children }: { children: ReactNode }) {
  const [supportNumber, setSupportNumber] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchJson<{ admin_info: SupportInfo | null }>(website.support)
      .then((res) => {
        if (!cancelled) {
          setSupportNumber(res.admin_info?.support_number ?? "");
        }
      })
      .catch(() => {
        /* optional for chrome */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ supportNumber, setSupportNumber }),
    [supportNumber],
  );

  return (
    <SupportContext.Provider value={value}>{children}</SupportContext.Provider>
  );
}
