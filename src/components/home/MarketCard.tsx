import { Link } from "react-router-dom";
import { Clock, Lock, Play, ChartLine } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import { ResultLine } from "./ResultLine";
import "./MarketCard.css";

export type MarketVariant = "main" | "starline" | "jackpot" | "night";

interface Chip {
  label: string;
  value: string;
}

interface ChartLink {
  label: string;
  to: string;
}

interface MarketCardProps {
  title: string;
  result: string;
  chips: Chip[];
  variant?: MarketVariant;
  isOpen?: boolean;
  charts?: ChartLink[];
}

function resultKind(variant: MarketVariant) {
  if (variant === "starline") return "starline" as const;
  if (variant === "jackpot") return "jackpot" as const;
  return "main" as const;
}

export function MarketCard({
  title,
  result,
  chips,
  variant = "main",
  isOpen = true,
  charts = [],
}: MarketCardProps) {
  const meta = chips.filter((chip) => chip.label.toLowerCase() !== "result");
  const open = meta.find((c) => /open|time/i.test(c.label))?.value;
  const close = meta.find((c) => /close/i.test(c.label))?.value;
  const schedule =
    open && close ? `${open} – ${close}` : open || close || meta.map((c) => c.value).join(" · ");

  return (
    <article className={`market-card market-card--${variant} ${isOpen ? "is-open" : "is-closed"}`}>
      <div className="market-card-body">
        <h3 className="market-title">{title}</h3>

        {schedule ? (
          <div className="market-schedule">
            <Clock size={13} strokeWidth={2.4} aria-hidden />
            <span>{schedule}</span>
          </div>
        ) : null}

        <ResultLine value={result} kind={resultKind(variant)} size="lg" />
      </div>

      <div className="market-card-action">
        {charts.length > 0 ? (
          <div className="market-charts">
            {charts.map((c) => (
              <Link key={c.to} to={c.to} className="chart-btn" aria-label={`${c.label} chart`}>
                <ChartLine size={14} strokeWidth={2.4} aria-hidden />
                <span>{c.label}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {isOpen ? (
          <button
            type="button"
            className="play-btn"
            onClick={openApkDownload}
            aria-label={`Play ${title}`}
          >
            <Play size={22} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            className="lock-btn"
            onClick={openApkDownload}
            aria-label={`${title} closed — get the app`}
          >
            <Lock size={18} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </article>
  );
}
