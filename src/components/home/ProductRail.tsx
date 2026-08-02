import "./ProductRail.css";

const PRODUCTS = [
  { id: "markets", label: "Main", tone: "main" },
  { id: "night", label: "Night", tone: "night" },
  { id: "starline", label: "Bombay Starline", tone: "starline" },
  { id: "jackpot", label: "Bombay Jackpot", tone: "jackpot" },
  { id: "lottery", label: "Lottery", tone: "lottery" },
] as const;

export function ProductRail() {
  return (
    <nav className="product-rail" aria-label="Products">
      <div className="container product-rail-inner">
        {PRODUCTS.map((p) => (
          <a key={p.id} href={`#${p.id}`} className={`product-chip product-chip--${p.tone}`}>
            {p.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
