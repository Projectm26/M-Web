import { useEffect, useState } from "react";
import { Ticket, Play, Trophy, X } from "lucide-react";
import type { LotteryGame, LotteryResultRow } from "../../lib/types";
import { openApkDownload } from "../../hooks/useHomeData";
import { SectionHead } from "./SectionHead";
import "./LotterySection.css";

interface LotterySectionProps {
  games: LotteryGame[];
  results: LotteryResultRow[];
  loading?: boolean;
}

function splitWinningTickets(value: string | number[] | null | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  const text = String(value).trim();
  if (!text || text === "—" || text === "---") return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
  }
  return text
    .split(/[,·|/\s]+/)
    .map((s) => s.trim())
    .filter((s) => s && s !== "—" && s !== "-");
}

function formatMoney(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Same as app jackpotHeadline(): manual override first, else pot estimate. */
function jackpotHeadline(game: LotteryGame): string | null {
  const override = game.jackpot_override;
  if (override != null && String(override).trim() !== "") {
    const n = Number(override);
    if (Number.isFinite(n) && n > 0) return formatMoney(n);
    if (!Number.isFinite(n) && String(override).trim() !== "0") {
      return formatMoney(override);
    }
  }
  const pot = game.pot_estimate;
  if (pot == null || pot === "") return null;
  const n = Number(pot);
  if (Number.isFinite(n) && n > 0) return formatMoney(n);
  return null;
}

/* —— Winning tickets ——
   Gold → purple → neutral tiers, so long lists still read as tiers. */
function tierClass(i: number) {
  if (i === 0) return "lottery-win--gold";
  if (i <= 2) return "lottery-win--violet";
  return "lottery-win--plain";
}

function WinningChips({
  tickets,
  onOpen,
}: {
  tickets: string[];
  onOpen: (tickets: string[]) => void;
}) {
  const count = tickets.length;
  const showAll = count <= 8;
  const preview = showAll ? tickets : tickets.slice(0, 3);

  return (
    <div className="lottery-wins">
      <div className="lottery-wins-head">
        <span className="lottery-wins-label">
          {count} winner{count === 1 ? "" : "s"}
        </span>
        {count > 1 ? (
          <button
            type="button"
            className="lottery-wins-open"
            onClick={() => onOpen(tickets)}
          >
            View all
          </button>
        ) : null}
      </div>

      <div className="lottery-wins-row" aria-label={`Winning tickets: ${tickets.join(", ")}`}>
        {preview.map((ticket, i) => (
          <span className={`lottery-win ${tierClass(i)}`} key={`${ticket}-${i}`}>
            {ticket}
          </span>
        ))}
        {!showAll ? (
          <button
            type="button"
            className="lottery-win lottery-win--more"
            onClick={() => onOpen(tickets)}
          >
            +{count - preview.length}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* —— Full winners sheet —— */
interface WinnersSheetState {
  title: string;
  tickets: string[];
}

function WinnersSheet({
  open,
  title,
  tickets,
  onClose,
}: WinnersSheetState & { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lottery-sheet" role="dialog" aria-modal="true" aria-label="Winning tickets" onClick={onClose}>
      <div className="lottery-sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="lottery-sheet-head">
          <div>
            <p className="lottery-sheet-kicker">
              <Trophy size={13} aria-hidden /> Declared
            </p>
            <h3>{title}</h3>
            <p className="lottery-sheet-count">
              {tickets.length} winning ticket{tickets.length === 1 ? "" : "s"}
            </p>
          </div>
          <button type="button" className="lottery-sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="lottery-sheet-list">
          {tickets.map((ticket, i) => (
            <span className={`lottery-win ${tierClass(i)}`} key={`${ticket}-${i}`}>
              <em className="lottery-win-rank">#{i + 1}</em>
              {ticket}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LotterySection({ games, results, loading }: LotterySectionProps) {
  const [sheet, setSheet] = useState<WinnersSheetState & { open: boolean }>({
    open: false,
    title: "",
    tickets: [],
  });

  const featured = [...games]
    .filter((g) => !String(g.name || "").toLowerCase().includes("testing"))
    .sort((a, b) => Number(b.is_featured || 0) - Number(a.is_featured || 0))
    .slice(0, 6);
  const empty = !loading && !featured.length;

  return (
    <section id="lottery" className="section-block lottery-section">
      <div className="container">
        <SectionHead
          tone="lottery"
          eyebrow="Draws · Tickets"
          title="Lottery"
          copy="Separate lottery draws with ticket pots — play from the Shubh555 app alongside matka markets."
        />

        {loading && empty ? (
          <div className="lottery-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="skeleton lottery-skeleton" key={i} />
            ))}
          </div>
        ) : empty ? (
          <div className="state-block">Lottery games will show here when configured.</div>
        ) : (
          <div className="lottery-grid">
            {featured.map((game) => {
              const pot = jackpotHeadline(game);
              const tickets = splitWinningTickets(game.last_result?.winning_numbers);
              const drawn = tickets.length > 0;
              const price = formatMoney(game.ticket_price);

              return (
                <article
                  className={`lottery-ticket ${drawn ? "is-drawn" : ""} ${game.playable ? "is-live" : ""}`}
                  key={game.id}
                >
                  <div className="lottery-ticket-body">
                    <div className="lottery-ticket-head">
                      <div className="lottery-ticket-titles">
                        <h3>{game.name}</h3>
                        <p className="lottery-tagline">
                          {game.tagline || game.description || "Official lottery draw"}
                        </p>
                      </div>
                      <div className="lottery-seals">
                        {game.badge_label ? (
                          <span className="lottery-seal lottery-seal--badge">{game.badge_label}</span>
                        ) : null}
                        {game.playable ? (
                          <span className="lottery-seal lottery-seal--live">Live</span>
                        ) : drawn ? (
                          <span className="lottery-seal lottery-seal--drawn">Drawn</span>
                        ) : (
                          <span className="lottery-seal lottery-seal--soon">Soon</span>
                        )}
                      </div>
                    </div>

                    {drawn ? (
                      <WinningChips
                        tickets={tickets}
                        onOpen={(list) =>
                          setSheet({ open: true, title: game.name, tickets: list })
                        }
                      />
                    ) : pot ? (
                      <div className="lottery-jackpot">
                        <span>Jackpot</span>
                        <strong>{pot}</strong>
                      </div>
                    ) : (
                      <div className="lottery-await">
                        <Ticket size={16} aria-hidden />
                        <span>Numbers drop after the draw</span>
                      </div>
                    )}
                  </div>

                  <div className="lottery-perforation" aria-hidden>
                    <span className="lottery-notch lottery-notch--l" />
                    <span className="lottery-dash" />
                    <span className="lottery-notch lottery-notch--r" />
                  </div>

                  <div className="lottery-stub">
                    <div className="lottery-stub-meta">
                      <span className="lottery-stub-label">
                        {drawn ? "Result time" : game.draw_time_clock ? "Draw" : "Entry"}
                      </span>
                      <strong>
                        {drawn
                          ? game.draw_time_clock || "Declared"
                          : game.draw_time_clock || price || "In app"}
                      </strong>
                      {!drawn && price && game.draw_time_clock ? (
                        <em className="lottery-stub-price">{price}</em>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="lottery-play-btn"
                      onClick={openApkDownload}
                      aria-label={`Play ${game.name}`}
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {results.length > 0 ? (
          <div className="lottery-recent">
            <div className="lottery-recent-head">
              <Ticket size={16} aria-hidden />
              <h3>Recent results</h3>
            </div>
            <ul>
              {results.slice(0, 5).map((row, i) => {
                const tickets = splitWinningTickets(row.winning_numbers);
                const when = row.declared_at
                  ? new Date(row.declared_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;
                const preview = tickets.slice(0, 3);
                return (
                  <li key={`${row.game_name}-${row.declared_at}-${i}`}>
                    <div className="lottery-recent-info">
                      <span className="lottery-recent-name">{row.game_name || "Lottery"}</span>
                      {when ? <span className="lottery-recent-when">{when}</span> : null}
                    </div>
                    {tickets.length ? (
                      <div className="lottery-recent-wins">
                        {preview.map((ticket, ti) => (
                          <span className={`lottery-win ${tierClass(ti)}`} key={`${ticket}-${ti}`}>
                            {ticket}
                          </span>
                        ))}
                        {tickets.length > 3 ? (
                          <button
                            type="button"
                            className="lottery-win lottery-win--more"
                            onClick={() =>
                              setSheet({
                                open: true,
                                title: row.game_name || "Lottery",
                                tickets,
                              })
                            }
                          >
                            +{tickets.length - 3}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="lottery-recent-empty">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <WinnersSheet
        open={sheet.open}
        title={sheet.title}
        tickets={sheet.tickets}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />
    </section>
  );
}
