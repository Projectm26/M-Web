import type { MarketGame } from "../../lib/types";
import { formatClock } from "../../lib/time";
import { MarketCard } from "./MarketCard";
import { SectionHead } from "./SectionHead";
import "./LiveMarkets.css";
import "./NightMarketSection.css";

interface NightMarketSectionProps {
  games: MarketGame[];
  loading?: boolean;
}

export function NightMarketSection({ games, loading }: NightMarketSectionProps) {
  const empty = !loading && !games.length;

  return (
    <section id="night" className="section-block night-section">
      <div className="container">
        <SectionHead
          tone="night"
          eyebrow="Night satta"
          title="Night Market"
          copy="Evening matka sessions with open–close results and Jodi / Pana charts."
        />

        {loading && empty ? (
          <div className="markets-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton market-skeleton" key={i} />
            ))}
          </div>
        ) : empty ? (
          <div className="state-block">Night matka sessions will show when scheduled.</div>
        ) : (
          <div className="markets-grid">
            {games.map((game, index) => {
              const id = game.game_id ?? game.id;
              const isOpen = game.play === 1;
              return (
                <MarketCard
                  key={`${id ?? game.game_name}-${index}`}
                  variant="night"
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
                            to: `/chart?type=jodi&id=${id}&name=${encodeURIComponent(game.game_name)}&market=night`,
                          },
                          {
                            label: "Pana",
                            to: `/chart?type=pana&id=${id}&name=${encodeURIComponent(game.game_name)}&market=night`,
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
