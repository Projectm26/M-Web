import { useEffect, useMemo, useState } from "react";
import type { GameRate, MarketRatesMap, RatesMarketId } from "../../lib/types";
import { SectionHead } from "./SectionHead";
import "./RatesGrid.css";

interface RatesGridProps {
  marketRates: MarketRatesMap;
  loading?: boolean;
}

const RATE_TABS: { id: RatesMarketId; label: string }[] = [
  { id: "main", label: "Main" },
  { id: "night", label: "Night" },
  { id: "starline", label: "Starline" },
  { id: "jackpot", label: "Jackpot" },
];

/** Main + Night: only these public rates (extras like Choice Pana / SP DP TP stay hidden). */
const MAIN_NIGHT_RATES: { match: RegExp; label: string; max: number }[] = [
  { match: /^(single\s*)?digit$/i, label: "Digit", max: 10 },
  { match: /^jodi(\s*digit)?$/i, label: "Jodi", max: 100 },
  { match: /^single\s*pann?a$/i, label: "Single pana", max: 160 },
  { match: /^(dp|double\s*pann?a)$/i, label: "Dp", max: 320 },
  { match: /^(tp|trip+le?\s*pann?a)$/i, label: "Tp", max: 1000 },
  { match: /^half\s*sangam$/i, label: "Half sangam", max: 1000 },
  { match: /^full\s*sangam$/i, label: "Full sangam", max: 10000 },
  { match: /^red(\s*brackets?)?$/i, label: "Red", max: 100 },
];

function formatPart(value: number | string) {
  const n = Number(value);
  if (Number.isFinite(n)) return n.toLocaleString("en-IN");
  return String(value ?? "—");
}

function multiplier(min: number | string, max: number | string) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0) return null;
  const m = b / a;
  if (!Number.isFinite(m)) return null;
  return Number.isInteger(m) ? `${m}×` : `${m.toFixed(1).replace(/\.0$/, "")}×`;
}

function normalizeType(type: string) {
  return type.replace(/_/g, " ").trim();
}

/** Drop underscore duplicates when a spaced twin exists (e.g. Jodi_Digit). */
function cleanRates(rates: GameRate[]): GameRate[] {
  const types = new Set(rates.map((r) => normalizeType(r.type).toLowerCase()));
  return rates.filter((r) => {
    if (!r.type.includes("_")) return true;
    return !types.has(normalizeType(r.type).toLowerCase());
  });
}

/**
 * Main/Night: keep only the public allowlist, in fixed order, with declared payouts.
 * Backend rows must exist for a type to appear (no invented rows).
 */
function filterMainNightRates(rates: GameRate[]): GameRate[] {
  const cleaned = cleanRates(rates);
  const out: GameRate[] = [];

  for (const entry of MAIN_NIGHT_RATES) {
    const hit = cleaned.find((r) => entry.match.test(normalizeType(r.type)));
    if (!hit) continue;
    const min = Number(hit.min);
    const stake = Number.isFinite(min) && min > 0 ? min : 1;
    out.push({
      ...hit,
      type: entry.label,
      min: stake,
      max: entry.max * stake,
    });
  }

  return out;
}

function ratesForMarket(market: RatesMarketId, rates: GameRate[]): GameRate[] {
  if (market === "main" || market === "night") {
    return filterMainNightRates(rates);
  }
  return cleanRates(rates).map((r) => ({
    ...r,
    type: normalizeType(r.type),
  }));
}

export function RatesGrid({ marketRates, loading }: RatesGridProps) {
  const filteredByMarket = useMemo(() => {
    const next = {} as Record<RatesMarketId, GameRate[]>;
    for (const tab of RATE_TABS) {
      next[tab.id] = ratesForMarket(tab.id, marketRates[tab.id] ?? []);
    }
    return next;
  }, [marketRates]);

  const availableTabs = useMemo(
    () => RATE_TABS.filter((tab) => (filteredByMarket[tab.id]?.length ?? 0) > 0),
    [filteredByMarket],
  );

  const [active, setActive] = useState<RatesMarketId>("main");

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.some((t) => t.id === active)) {
      setActive(availableTabs[0].id);
    }
  }, [availableTabs, active]);

  const rates = filteredByMarket[active] ?? [];
  const showSwitcher = availableTabs.length > 1;
  const empty = !loading && !availableTabs.length;

  return (
    <section id="rates" className="section-block rates-section">
      <div className="container">
        <SectionHead
          eyebrow="Payout rates"
          title="Game Rates"
          copy="Digit, Jodi, Pana, Sangam & Red for Main and Night — switch tabs for Starline and Jackpot."
        />

        {showSwitcher ? (
          <div className="rates-switcher" role="tablist" aria-label="Market rates">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active === tab.id}
                className={`rates-switch${active === tab.id ? " is-active" : ""} rates-switch--${tab.id}`}
                onClick={() => setActive(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {loading && !rates.length && !availableTabs.length ? (
          <div className="rates-sheet" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeleton rates-row-skeleton" key={i} />
            ))}
          </div>
        ) : rates.length ? (
          <div className={`rates-sheet rates-sheet--${active}`}>
            <div className="rates-sheet-head" aria-hidden>
              <span>Game</span>
              <span>Bid → Win</span>
              <span>Rate</span>
            </div>
            <ul className="rates-list">
              {rates.map((rate, i) => {
                const multi = multiplier(rate.min, rate.max);
                return (
                  <li className="rate-row" key={`${active}-${rate.type}-${rate.id ?? i}`}>
                    <span className="rate-row-type">{rate.type}</span>
                    <span className="rate-row-payout">
                      <span className="rate-row-bet">₹{formatPart(rate.min)}</span>
                      <span className="rate-row-arrow" aria-hidden>
                        →
                      </span>
                      <span className="rate-row-win">₹{formatPart(rate.max)}</span>
                    </span>
                    <span className="rate-row-multi">{multi ?? "—"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : empty ? (
          <div className="state-block">Rates will appear once markets are configured.</div>
        ) : (
          <div className="state-block">No rates for this market yet.</div>
        )}
      </div>
    </section>
  );
}
