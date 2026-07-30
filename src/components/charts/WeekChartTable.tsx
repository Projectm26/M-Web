import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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

export const WeekChartTable = forwardRef<WeekChartTableHandle, WeekChartTableProps>(
  function WeekChartTable({ kind, weeks, loading }, ref) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const accent = chartAccent(kind);
    const compactDate = kind === "starline" || kind === "jackpot" || kind === "jodi";
    const meta = chartHistoryMeta(weeks);

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
      const el = bodyRef.current;
      if (!el || loading || !weeks.length) return;
      // Land on newest weeks (bottom), like the app.
      el.scrollTop = el.scrollHeight;
    }, [weeks, loading]);

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
              {CHART_DAY_HEADERS.map((day) => (
                <div className="week-chart-th" key={day}>
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
        </div>
      </div>
    );
  },
);
