import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { dayjs } from "../../lib/time";
import {
  buildWinBadges,
  CHART_DAY_HEADERS,
  chartAccent,
  chartHistoryMeta,
  chartPlaceholder,
  formatWeekRangeLabel,
  type ChartKind,
  type ChartWeekRow,
} from "../../lib/chartFormat";
import "./WeekChartTable.css";

export interface WeekChartTableHandle {
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

interface WeekChartTableProps {
  kind: ChartKind;
  weeks: ChartWeekRow[];
  loading?: boolean;
}

const MOBILE_DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export const WeekChartTable = forwardRef<WeekChartTableHandle, WeekChartTableProps>(
  function WeekChartTable({ kind, weeks, loading }, ref) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const accent = chartAccent(kind);
    const [compactUi, setCompactUi] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const compactDate = compactUi || kind === "starline" || kind === "jackpot" || kind === "jodi";
    const meta = chartHistoryMeta(weeks);
    const dayHeaders = compactUi ? MOBILE_DAY_HEADERS : CHART_DAY_HEADERS;

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
      const mq = window.matchMedia("(max-width: 720px)");
      const sync = () => setCompactUi(mq.matches);
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
      const el = bodyRef.current;
      if (!el || loading || !weeks.length) return;
      // Land on newest weeks (bottom), like the app.
      el.scrollTop = el.scrollHeight;
      if (weeks.length > 4) {
        setShowHint(true);
        const timer = window.setTimeout(() => setShowHint(false), 6500);
        return () => window.clearTimeout(timer);
      }
      setShowHint(false);
    }, [weeks, loading]);

    useEffect(() => {
      const el = bodyRef.current;
      if (!el || !showHint) return;
      const onScroll = () => {
        if (el.scrollTop < el.scrollHeight - el.clientHeight - 12) {
          setShowHint(false);
        }
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    }, [showHint]);

    return (
      <div className={`week-chart week-chart--${accent} week-chart--${kind}`}>
        {!loading && weeks.length > 0 ? (
          <div className="week-chart-meta">
            <span className="week-chart-meta-pill">Full history</span>
            <span>
              {meta.weekCount} weeks · {meta.resultCount} results
            </span>
            {meta.from && meta.to ? (
              <span className="week-chart-meta-range">
                {dayjs(meta.from).format("D MMM YYYY")} → {dayjs(meta.to).format("D MMM YYYY")}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="week-chart-frame">
          <div className="week-chart-body" ref={bodyRef}>
            <div className="week-chart-head" role="row">
              <div className="week-chart-date-col week-chart-th">Date</div>
              {dayHeaders.map((day, i) => (
                <div className="week-chart-th" key={`${day}-${i}`}>
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div className="week-chart-row week-chart-row--skeleton" key={i}>
                  <div className="week-chart-date-col skeleton" />
                  {CHART_DAY_HEADERS.map((d) => (
                    <div className="skeleton week-chart-skel-cell" key={d} />
                  ))}
                </div>
              ))
            ) : weeks.length === 0 ? (
              <div className="week-chart-empty">No results to show yet.</div>
            ) : (
              weeks.map((week, index) => {
                const label = formatWeekRangeLabel(week.rangeStart, week.rangeEnd, compactDate);
                const year = dayjs(week.rangeStart).year();
                const prevYear = index > 0 ? dayjs(weeks[index - 1].rangeStart).year() : null;
                const showYear = prevYear == null || prevYear !== year;

                return (
                  <div key={week.rangeStart}>
                    {showYear ? (
                      <div className="week-chart-year" aria-hidden>
                        {year}
                      </div>
                    ) : null}
                    <div className="week-chart-row" role="row">
                      <div className="week-chart-date-col">
                        <span className="week-chart-date-primary">{label.primary}</span>
                        {!compactDate ? <span className="week-chart-date-to">to</span> : null}
                        <span className="week-chart-date-secondary">{label.secondary}</span>
                      </div>
                      {week.days.map((cell, i) => {
                        const result = cell?.result || chartPlaceholder(kind);
                        const badges = buildWinBadges(result, kind);
                        const hasData = badges.some((b) => !b.isPlaceholder);
                        const family = cell?.colour === "red";
                        return (
                          <div
                            className={`week-chart-cell ${hasData ? "has-data" : ""} ${family ? "is-family" : ""}`}
                            key={`${week.rangeStart}-${i}`}
                          >
                            {badges.map((badge, bi) => (
                              <span
                                key={`${badge.text}-${bi}`}
                                className={[
                                  "week-chart-badge",
                                  badge.isPlaceholder ? "is-placeholder" : "",
                                  badge.highlight ? "is-highlight" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                {badge.text}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="week-chart-hint" hidden={!showHint} aria-hidden>
            Scroll for more
          </div>
        </div>
      </div>
    );
  },
);
