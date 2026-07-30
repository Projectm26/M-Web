import type { GameRate } from "../../lib/types";
import { SectionHead } from "./SectionHead";
import "./RatesGrid.css";

interface RatesGridProps {
  rates: GameRate[];
  loading?: boolean;
}

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

export function RatesGrid({ rates, loading }: RatesGridProps) {
  return (
    <section id="rates" className="section-block rates-section">
      <div className="container">
        <SectionHead
          eyebrow="Official payouts"
          title="Game Rates"
          copy="Declared bid-to-win rates — same numbers as the Shubh555 app."
        />

        {loading && !rates.length ? (
          <div className="rates-sheet" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeleton rates-row-skeleton" key={i} />
            ))}
          </div>
        ) : rates.length ? (
          <div className="rates-sheet">
            <div className="rates-sheet-head" aria-hidden>
              <span>Game</span>
              <span>Bid → Win</span>
              <span>Rate</span>
            </div>
            <ul className="rates-list">
              {rates.map((rate, i) => {
                const multi = multiplier(rate.min, rate.max);
                return (
                  <li className="rate-row" key={`${rate.type}-${i}`}>
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
        ) : (
          <div className="state-block">Rates will appear once markets are configured.</div>
        )}
      </div>
    </section>
  );
}
