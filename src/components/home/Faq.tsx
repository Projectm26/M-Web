import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SectionHead } from "./SectionHead";
import "./Faq.css";

const FAQ_ITEMS = [
  {
    q: "What is Shubh555?",
    a: "Shubh555 is the official app for matka markets — Main, Night Market, Bombay Starline, Bombay Jackpot, and Lottery — with live results, charts, wallet deposits, and withdrawals.",
  },
  {
    q: "Which products can I play?",
    a: "Main markets through the day, Night Market in the evening, plus Bombay Starline, Bombay Jackpot, and Lottery. This website shows results for reference; place bids only in the official Android app.",
  },
  {
    q: "What is Night Market?",
    a: "Night Market is the evening matka product with its own open/close times, result boards, and charts. It runs separately from daytime Main markets.",
  },
  {
    q: "How do Night Market results work?",
    a: "Each Night game lists Open and Close times. The open digit posts after the open window; close completes the full result line. Pending slots show as dashes until declared.",
  },
  {
    q: "How do I place a bid?",
    a: "Download the official Shubh555 app, add balance to your wallet, open the market you want (Main, Night, Bombay Starline, Bombay Jackpot, or Lottery), and submit before the game closes.",
  },
  {
    q: "How does Lottery work?",
    a: "Open Lottery in the app, pick a draw while tickets are on sale, and buy before draw time. Winning numbers appear on the site and in the app after the draw is declared.",
  },
  {
    q: "Where can I see game rates?",
    a: "Payout rates for common game types are listed in the Rates section on this site. Exact bid options and wallet settlement happen inside the app.",
  },
  {
    q: "How do I check charts and history?",
    a: "Open Charts from the menu or a market card. You can browse Jodi, Pana, and related history for Main and Night markets to review past declared results.",
  },
  {
    q: "Can I bid from this website?",
    a: "No. The website is for live boards, charts, rates, and downloads. All bidding, wallet top-ups, and withdrawals are only in the official Android app.",
  },
  {
    q: "How do I contact support?",
    a: "Use WhatsApp from the site footer with the official support number, or open Support inside the Shubh555 app for account and wallet help.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section-block faq-section" id="faq" aria-labelledby={`${baseId}-title`}>
      <div className="container faq-layout">
        <div className="faq-intro">
          <SectionHead
            id={`${baseId}-title`}
            eyebrow="Help centre"
            title="Frequently asked questions"
            copy="Markets, Night sessions, lottery, rates, charts, and the official app — quick answers before you download."
          />
        </div>

        <div className="faq-list" role="list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const triggerId = `${baseId}-trigger-${i}`;

            return (
              <div
                className={`faq-item ${isOpen ? "is-open" : ""}`}
                key={item.q}
                role="listitem"
              >
                <button
                  type="button"
                  id={triggerId}
                  className="faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="faq-question">{item.q}</span>
                  <span className="faq-icon" aria-hidden>
                    {isOpen ? (
                      <Minus size={16} strokeWidth={2.5} />
                    ) : (
                      <Plus size={16} strokeWidth={2.5} />
                    )}
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="faq-panel"
                  hidden={!isOpen}
                >
                  <p className="faq-answer">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
