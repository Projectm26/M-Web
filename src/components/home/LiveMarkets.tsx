import type { MarketGame, TimedGame } from "../../lib/types";
import { formatClock, pickCurrentTimedGame, stripTimeFromName } from "../../lib/time";
import { MarketCard } from "./MarketCard";
import { SectionHead } from "./SectionHead";
import "./LiveMarkets.css";

interface LiveMarketsProps {
  mainGames: MarketGame[];
  starlineGames: TimedGame[];
  jackpotGames: TimedGame[];
  jackpotSummary: MarketGame | null;
  starlineSummary: MarketGame | null;
  loading?: boolean;
}

export function LiveMarkets({
  mainGames,
  starlineGames,
  jackpotGames,
  jackpotSummary,
  starlineSummary,
  loading,
}: LiveMarketsProps) {
  const currentJackpot = pickCurrentTimedGame(jackpotGames);
  const currentStarline = pickCurrentTimedGame(starlineGames);

  const jackpotTime = currentJackpot?.result_time;
  const jackpotName =
    stripTimeFromName(jackpotSummary?.game_name || currentJackpot?.game_name, "Bombay Jackpot") ||
    "Bombay Jackpot";
  const jackpotDisplay =
    jackpotSummary?.resultData || currentJackpot?.resultData || "---";

  const starlineResult =
    starlineSummary?.resultData || currentStarline?.resultData || "---";
  const starlineClock = formatClock(
    currentStarline?.result_time ||
      (starlineSummary?.game_name?.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)?.[0] ?? null),
  );
  const starlineTitle = stripTimeFromName(
    starlineSummary?.game_name || currentStarline?.game_name,
    "Bombay Starline",
  );

  const empty =
    !loading && !jackpotSummary && !starlineSummary && !currentJackpot && !currentStarline && !mainGames.length;

  return (
    <section id="markets" className="section-block live-markets">
      <div className="container">
        <SectionHead
          tone="main"
          eyebrow="Open · Close · Charts"
          title="Live Markets"
          copy="Main boards, current Bombay Starline & Bombay Jackpot — declared results through the day."
        />

        <div id="jackpot" className="section-anchor" aria-hidden />
        <div id="starline" className="section-anchor" aria-hidden />

        {loading && empty ? (
          <div className="markets-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div className="skeleton market-skeleton" key={i} />
            ))}
          </div>
        ) : empty ? (
          <div className="state-block">No markets available right now.</div>
        ) : (
          <div className="markets-grid">
            {jackpotSummary || currentJackpot ? (
              <MarketCard
                variant="jackpot"
                title={jackpotName}
                result={jackpotDisplay}
                chips={[{ label: "Time", value: formatClock(jackpotTime) }]}
                charts={[
                  { label: "Day", to: "/chart?type=jackpot-day" },
                  { label: "Night", to: "/chart?type=jackpot-night" },
                ]}
              />
            ) : null}

            {starlineSummary || currentStarline ? (
              <MarketCard
                variant="starline"
                title={starlineTitle}
                result={starlineResult}
                chips={[{ label: "Time", value: starlineClock }]}
                charts={[
                  { label: "Day", to: "/chart?type=starline-day" },
                  { label: "Night", to: "/chart?type=starline-night" },
                ]}
              />
            ) : null}

            {mainGames.map((game, index) => {
              const isOpen = game.play === 1;
              const id = game.game_id ?? game.id;
              return (
                <MarketCard
                  key={`${id ?? game.game_name}-${index}`}
                  variant="main"
                  title={game.game_name}
                  result={game.resultData || "---"}
                  isOpen={isOpen}
                  chips={[
                    { label: "Open", value: formatClock(game.open_time) },
                    { label: "Close", value: formatClock(game.close_time) },
                  ]}
                  charts={
                    id != null
                      ? [
                          {
                            label: "Jodi",
                            to: `/chart?type=jodi&id=${id}&name=${encodeURIComponent(game.game_name)}`,
                          },
                          {
                            label: "Pana",
                            to: `/chart?type=pana&id=${id}&name=${encodeURIComponent(game.game_name)}`,
                          },
                        ]
                      : [{ label: "Chart", to: "/chart" }]
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
