import { normalizeGameResultDisplay } from "../../lib/resultFormat";
import "./ResultBoard.css";

interface ResultBoardProps {
  value?: string | null;
  size?: "sm" | "md" | "lg";
}

export function ResultBoard({ value, size = "md" }: ResultBoardProps) {
  const text = normalizeGameResultDisplay(value, "---");
  const chars = text.split("");

  return (
    <div className={`result-board result-board--${size}`} aria-label={`Result ${text}`}>
      {chars.map((ch, i) => {
        if (ch === "-" || ch === "_" || ch === "–" || ch === " ") {
          return (
            <span className="result-sep" key={`${ch}-${i}`} aria-hidden>
              {ch === " " ? "" : "-"}
            </span>
          );
        }
        const isPlaceholder = ch === "*" || ch === "•";
        return (
          <span
            className={`result-digit ${isPlaceholder ? "is-placeholder" : ""}`}
            key={`${ch}-${i}`}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}
