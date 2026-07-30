import { isDigitResult, normalizeGameResultDisplay, resultFallback, type MarketResultKind } from "../../lib/resultFormat";
import "./ResultLine.css";

interface ResultLineProps {
  value?: string | null;
  kind?: MarketResultKind;
  size?: "md" | "lg";
}

export function ResultLine({ value, kind = "main", size = "lg" }: ResultLineProps) {
  const raw = value?.trim() || "";
  const digit = isDigitResult(raw) || !raw || raw === "---";
  const display = digit
    ? normalizeGameResultDisplay(raw, resultFallback(kind))
    : raw;

  if (!digit) {
    return <p className={`result-line result-line--${size} result-line--status`}>{display}</p>;
  }

  return (
    <p className={`result-line result-line--${size}`} aria-label={`Result ${display}`}>
      {display.split("").map((ch, i) => {
        const isSep = ch === "-" || ch === "_";
        return (
          <span
            key={`${ch}-${i}`}
            className={
              isSep ? "result-line-sep" : ch === "*" ? "result-line-pending" : "result-line-digit"
            }
          >
            {isSep ? "-" : ch}
          </span>
        );
      })}
    </p>
  );
}
