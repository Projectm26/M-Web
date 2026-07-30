import "./SectionHead.css";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  copy?: string;
  tone?: "main" | "night" | "starline" | "jackpot" | "lottery" | "neutral";
  id?: string;
}

export function SectionHead({
  eyebrow,
  title,
  copy,
  tone = "neutral",
  id,
}: SectionHeadProps) {
  return (
    <div className={`section-head section-head--${tone}`} id={id}>
      <div className="section-head-ornament" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="section-head-eyebrow">{eyebrow}</p>
      <h2 className="section-head-title">{title}</h2>
      {copy ? <p className="section-head-copy">{copy}</p> : null}
    </div>
  );
}
