import { normalizeGameResultDisplay } from "../../lib/resultFormat";
import type { LiveResultItem } from "../../lib/types";
import "./LiveTicker.css";

interface LiveTickerProps {
  items: LiveResultItem[];
}

function isDeclared(result: string) {
  return /\d/.test(result);
}

export function LiveTicker({ items }: LiveTickerProps) {
  if (!items.length) return null;

  const declared = items.filter((item) => isDeclared(item.result));
  const feed = declared.length ? declared : items;

  const row = (
    <>
      {feed.map((item, i) => (
        <span className="live-ticker-item" key={`${item.gameName}-${i}`}>
          <span className="live-ticker-name">{item.gameName}</span>
          <span className="live-ticker-result">
            {normalizeGameResultDisplay(item.result, "***-**-***")}
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div className="live-ticker" role="region" aria-label="Live results">
      <div className="live-ticker-label">
        <span className="live-dot" aria-hidden />
        LIVE
      </div>
      <div className="live-ticker-track">
        <div className="live-ticker-scroll">
          {row}
          {row}
        </div>
      </div>
    </div>
  );
}
