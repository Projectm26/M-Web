import type { CSSProperties } from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { dayjs } from "../../lib/time";
import { buildWinBadges } from "../../lib/chartFormat";
import type { DayChartKind, DayChartRow } from "../../hooks/useDayChartData";
import "./DayChartTable.css";

export interface DayChartTableHandle {
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

interface DayChartTableProps {
  kind: DayChartKind;
  hours: number[];
  rows: DayChartRow[];
  loading?: boolean;
}

/** Compact hour label so 12 columns fit: 8a, 12p, 1p … */
function formatHourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "a" : "p";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

function productKind(kind: DayChartKind): "starline" | "jackpot" {
  return kind.startsWith("starline") ? "starline" : "jackpot";
}

function DayChartCell({
  value,
  product,
}: {
  value: string | null | undefined;
  product: "starline" | "jackpot";
}) {
  const empty = value == null || value === "";
  const badges = buildWinBadges(empty ? "" : value, product);

  if (product === "starline") {
    const panna = badges[0]?.text ?? "***";
    const bottom = badges[1]?.text ?? "*";
    return (
      <div className={`day-chart-cell day-chart-cell--stacked${empty ? " day-chart-cell--muted" : ""}`}>
        <span className="day-chart-panna">{panna}</span>
        <span className="day-chart-bottom">{bottom}</span>
      </div>
    );
  }

  return (
    <div className={`day-chart-cell${empty ? " day-chart-cell--muted" : ""}`}>
      {badges[0]?.text ?? "**"}
    </div>
  );
}

export const DayChartTable = forwardRef<DayChartTableHandle, DayChartTableProps>(
  function DayChartTable({ kind, hours, rows, loading }, ref) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const product = productKind(kind);
    const colCount = Math.max(hours.length, 12);
    const [compactUi, setCompactUi] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      },
      scrollToBottom: () => {
        const el = bodyRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      },
    }));

    useEffect(() => {
      const mq = window.matchMedia("(max-width: 719px)");
      const sync = () => setCompactUi(mq.matches);
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
      const el = bodyRef.current;
      if (!el || loading || !rows.length) return;
      el.scrollTop = 0;
      if (rows.length > 8) {
        setShowHint(true);
        const timer = window.setTimeout(() => setShowHint(false), 6500);
        return () => window.clearTimeout(timer);
      }
      setShowHint(false);
    }, [rows, loading]);

    useEffect(() => {
      const el = bodyRef.current;
      if (!el || !showHint) return;
      const onScroll = () => {
        if (el.scrollTop > 12) setShowHint(false);
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    }, [showHint]);

    return (
      <div className={`day-chart day-chart--${product}`}>
        <p className="day-chart-hint">
          {product === "starline"
            ? "Panna on top · bottom digit below · scroll for more days"
            : "Jodi (xx) · scroll for more days"}
        </p>
        <div className="day-chart-frame">
          <div className="day-chart-body" ref={bodyRef}>
            <div
              className="day-chart-grid"
              style={{ "--day-cols": String(colCount) } as CSSProperties}
            >
              <div className="day-chart-head" role="row">
                <div className="day-chart-date-col day-chart-th">Date</div>
                {(hours.length ? hours : Array.from({ length: 12 }, (_, i) => i)).map((h, i) => (
                  <div className="day-chart-th" key={`${h}-${i}`}>
                    {hours.length ? formatHourLabel(h) : "—"}
                  </div>
                ))}
              </div>

              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div className="day-chart-row day-chart-row--skeleton" key={i}>
                    <div className="day-chart-date-col" />
                    {Array.from({ length: colCount }).map((__, j) => (
                      <div className="day-chart-cell" key={j} />
                    ))}
                  </div>
                ))
              ) : rows.length === 0 ? (
                <div className="day-chart-empty">No day-chart rows yet.</div>
              ) : (
                rows.map((row) => (
                  <div className="day-chart-row" key={row.date} role="row">
                    <div className="day-chart-date-col">
                      {dayjs(row.date).format(compactUi ? "D/M" : "D MMM")}
                    </div>
                    {hours.map((h, i) => (
                      <DayChartCell
                        key={`${row.date}-${h}`}
                        value={row.cells[i]}
                        product={product}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="day-chart-hint-flyout" hidden={!showHint} aria-hidden>
            Scroll for more
          </div>
        </div>
      </div>
    );
  },
);
