import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SectionHead } from "./SectionHead";
import "./Faq.css";

const FAQ_ITEMS = [
  {
    q: "What is Shubh555?",
    a: "Shubh555 is a satta matka platform for Main Market, Night Market, Bombay Starline, Bombay Jackpot, and Lottery. Check live open–close results and charts here; place bids only in the official Android app.",
  },
  {
    q: "How do open and close results work?",
    a: "Each market has an open and close time. After open, the open panna and digit are declared; after close, the full line (panna–jodi–panna) is complete. Dashes mean the result is not declared yet.",
  },
  {
    q: "How do I place a bid?",
    a: "Download the Shubh555 app, add wallet balance, pick Digit, Jodi, Single/Double/Triple Pana, Sangam, or Red, and submit before that market’s close time. This website does not accept bids.",
  },
  {
    q: "What rates do you pay?",
    a: "Public Main and Night rates are listed in the Rates section — Digit, Jodi, Single Pana, DP, TP, Half/Full Sangam, and Red. Starline and Jackpot rates are on their own tabs. Final settlement is always in the app wallet.",
  },
  {
    q: "Where can I see old charts?",
    a: "Open Charts from the menu or tap Jodi / Pana on a market card. You get week history for Main and Night, plus day/night boards for Bombay Starline and Bombay Jackpot.",
  },
  {
    q: "How do I contact support?",
    a: "Message the official WhatsApp number in the footer, or open Support inside the Shubh555 app for wallet and account help.",
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
            eyebrow="Help"
            title="Matka FAQs"
            copy="Open–close, rates, charts, and bidding — short answers before you download the app."
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
