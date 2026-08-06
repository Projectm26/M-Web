import type { ReactNode } from "react";
import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChartLine, ChevronRight, Moon, Sun } from "lucide-react";
import {
  DayChartTable,
  type DayChartTableHandle,
} from "../components/charts/DayChartTable";
import {
  WeekChartTable,
  type WeekChartTableHandle,
} from "../components/charts/WeekChartTable";
import { useChartHub, useChartView } from "../hooks/useChartData";
import {
  dayChartMeta,
  isDayChartKind,
  useDayChartView,
  type DayChartKind,
} from "../hooks/useDayChartData";
import {
  chartHistoryMeta,
  chartTitle,
  type ChartKind,
} from "../lib/chartFormat";
import { dayjs } from "../lib/time";
import { normalizeGameResultDisplay } from "../lib/resultFormat";
import "./ChartsPage.css";

const DAY_CHART_LINKS: DayChartKind[] = [
  "starline-day",
  "starline-night",
  "jackpot-day",
  "jackpot-night",
];

function parseKind(raw: string | null): ChartKind | null {
  if (raw === "jodi" || raw === "pana" || raw === "starline" || raw === "jackpot") {
    return raw;
  }
  return null;
}

export function ChartsPage() {
  const [params] = useSearchParams();
  const dayKind = params.get("type");
  if (isDayChartKind(dayKind)) {
    return <DayChartDetail kind={dayKind} />;
  }

  const kind = parseKind(dayKind);
  const id = params.get("id");
  const nameParam = params.get("name");
  const timeParam = params.get("time");
  const marketParam = params.get("market") === "night" ? "night" : "main";

  if (kind && id) {
    return (
      <ChartDetail
        kind={kind}
        id={id}
        nameHint={nameParam}
        timeHint={timeParam}
        market={marketParam}
      />
    );
  }

  return <ChartsHub />;
}

function ChartsHub() {
  const { mainGames, nightGames, loading } = useChartHub();

  return (
    <section className="charts-page">
      <div className="container charts-page-inner">
        <header className="charts-hero">
          <p className="charts-kicker">Satta charts</p>
          <h1>Charts</h1>
          <p className="charts-lead">
            Jodi and Pana week charts for Main and Night, plus Bombay Starline and Bombay Jackpot
            day/night hour boards — same history as the Shubh555 app.
          </p>
        </header>

        {loading ? (
          <div className="charts-hub-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton charts-hub-skel" key={i} />
            ))}
          </div>
        ) : (
          <>
            <HubSection
              title="Main markets"
              tone="main"
              empty="No main markets available."
            >
              {mainGames.map((game, i) => {
                const id = game.game_id ?? game.id;
                if (id == null) return null;
                return (
                  <div className="charts-hub-card" key={`main-${id}-${i}`}>
                    <div>
                      <h3>{game.game_name}</h3>
                      <p>
                        {game.resultData
                          ? normalizeGameResultDisplay(game.resultData, "—")
                          : "—"}
                      </p>
                    </div>
                    <div className="charts-hub-links">
                      <Link
                        to={`/chart?type=jodi&id=${id}&name=${encodeURIComponent(game.game_name)}`}
                        className="charts-hub-link"
                      >
                        Jodi <ChevronRight size={14} />
                      </Link>
                      <Link
                        to={`/chart?type=pana&id=${id}&name=${encodeURIComponent(game.game_name)}`}
                        className="charts-hub-link"
                      >
                        Pana <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </HubSection>

            <HubSection
              title="Night markets"
              tone="night"
              empty="No night markets available."
            >
              {nightGames.map((game, i) => {
                const id = game.game_id ?? game.id;
                if (id == null) return null;
                return (
                  <div className="charts-hub-card charts-hub-card--night" key={`night-${id}-${i}`}>
                    <div>
                      <h3>{game.game_name}</h3>
                      <p>
                        {game.resultData
                          ? normalizeGameResultDisplay(game.resultData, "—")
                          : "—"}
                      </p>
                    </div>
                    <div className="charts-hub-links">
                      <Link
                        to={`/chart?type=jodi&id=${id}&name=${encodeURIComponent(game.game_name)}&market=night`}
                        className="charts-hub-link"
                      >
                        Jodi <ChevronRight size={14} />
                      </Link>
                      <Link
                        to={`/chart?type=pana&id=${id}&name=${encodeURIComponent(game.game_name)}&market=night`}
                        className="charts-hub-link"
                      >
                        Pana <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </HubSection>

            <HubSection title="Bombay Starline & Bombay Jackpot day charts" tone="daypart" empty="">
              {DAY_CHART_LINKS.map((kind) => {
                const meta = dayChartMeta(kind);
                const isNight = meta.night === 1;
                return (
                  <Link
                    key={kind}
                    to={`/chart?type=${kind}`}
                    className={`charts-hub-card charts-hub-card--link charts-hub-card--${meta.product}`}
                  >
                    <div className="charts-hub-daypart">
                      <span className={`charts-daypart-icon charts-daypart-icon--${isNight ? "night" : "day"}`}>
                        {isNight ? <Moon size={16} /> : <Sun size={16} />}
                      </span>
                      <div>
                        <h3>{meta.title}</h3>
                        <p>{meta.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="charts-hub-chevron" />
                  </Link>
                );
              })}
            </HubSection>
          </>
        )}
      </div>
    </section>
  );
}

function HubSection({
  title,
  tone,
  empty,
  children,
}: {
  title: string;
  tone: string;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : [children].filter(Boolean);
  return (
    <div className={`charts-hub-section charts-hub-section--${tone}`}>
      <h2>{title}</h2>
      {items.length ? <div className="charts-hub-grid">{children}</div> : (
        <div className="state-block">{empty}</div>
      )}
    </div>
  );
}

function DayChartDetail({ kind }: { kind: DayChartKind }) {
  const tableRef = useRef<DayChartTableHandle>(null);
  const meta = dayChartMeta(kind);
  const { hours, rows, loading, error } = useDayChartView(kind);

  return (
    <section className="charts-page charts-page--day">
      <div className="container charts-page-inner charts-page-inner--day">
        <div className="charts-detail-top">
          <Link to="/chart" className="charts-back">
            <ArrowLeft size={16} />
            All charts
          </Link>
          <div className="charts-detail-heading">
            <span className={`charts-kind-pill charts-kind-pill--${meta.product}`}>
              <ChartLine size={13} />
              {meta.product} · {meta.night === 1 ? "night" : "day"}
            </span>
            <h1>{meta.title} chart</h1>
          </div>
          <div className="charts-detail-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => tableRef.current?.scrollToTop()}
            >
              Newest
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => tableRef.current?.scrollToBottom()}
            >
              Oldest
            </button>
          </div>
        </div>

        {error && !loading && !rows.length ? (
          <div className="state-block error" role="alert">
            {error}
          </div>
        ) : (
          <DayChartTable
            ref={tableRef}
            kind={kind}
            hours={hours}
            rows={rows}
            loading={loading}
          />
        )}

        {error && rows.length > 0 ? (
          <p className="charts-soft-error">{error}</p>
        ) : null}
      </div>
    </section>
  );
}

function ChartDetail({
  kind,
  id,
  nameHint,
  timeHint,
  market = "main",
}: {
  kind: ChartKind;
  id: string;
  nameHint: string | null;
  timeHint: string | null;
  market?: "main" | "night";
}) {
  const tableRef = useRef<WeekChartTableHandle>(null);
  const { weeks, gameName, loading, error } = useChartView(kind, id, market);
  const meta = chartHistoryMeta(weeks);
  const displayName =
    gameName ||
    nameHint ||
    (kind === "starline"
      ? `Starline ${timeHint || ""}`.trim()
      : kind === "jackpot"
        ? `Jackpot ${timeHint || ""}`.trim()
        : "Market");

  return (
    <section className="charts-page">
      <div className="container charts-page-inner">
        <div className="charts-detail-top">
          <Link to="/chart" className="charts-back">
            <ArrowLeft size={16} />
            All charts
          </Link>
          <div className="charts-detail-heading">
            <span
              className={`charts-kind-pill charts-kind-pill--${kind}${market === "night" ? " charts-kind-pill--night-market" : ""}`}
            >
              <ChartLine size={13} />
              {market === "night" ? `night · ${kind}` : kind}
            </span>
            <h1>{chartTitle(kind, displayName)}</h1>
            <p>
              Full database history · Mon–Sun weeks · newest at the bottom
              {!loading && meta.weekCount > 0
                ? ` · ${meta.weekCount} weeks (${dayjs(meta.from).format("YYYY")}–${dayjs(meta.to).format("YYYY")})`
                : ""}
            </p>
          </div>
          <div className="charts-detail-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => tableRef.current?.scrollToBottom()}
            >
              Newest
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => tableRef.current?.scrollToTop()}
            >
              Oldest
            </button>
          </div>
        </div>

        {error && !loading && !weeks.length ? (
          <div className="state-block error" role="alert">
            {error}
          </div>
        ) : (
          <WeekChartTable ref={tableRef} kind={kind} weeks={weeks} loading={loading} />
        )}

        {error && weeks.length > 0 ? (
          <p className="charts-soft-error">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
