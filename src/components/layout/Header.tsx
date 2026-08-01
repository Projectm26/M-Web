import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Download, Menu, X } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import "./Header.css";

interface HeaderProps {
  supportNumber?: string;
}

type NavItem =
  | { kind: "route"; to: string; label: string; end?: boolean }
  | { kind: "hash"; hash: string; label: string };

const NAV: NavItem[] = [
  { kind: "route", to: "/", label: "Home", end: true },
  { kind: "hash", hash: "markets", label: "Markets" },
  { kind: "hash", hash: "lottery", label: "Lottery" },
  { kind: "route", to: "/chart", label: "Charts" },
];

function isItemActive(item: NavItem, pathname: string, hash: string) {
  if (item.kind === "hash") {
    return pathname === "/" && hash === `#${item.hash}`;
  }
  if (item.to === "/") {
    return pathname === "/" && (hash === "" || hash === "#");
  }
  return pathname.startsWith(item.to);
}

export function Header(_props: HeaderProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header-inner container">
        <NavLink to="/" className="brand" aria-label="Shubh555 home">
          <img
            className="brand-logo-img"
            src="/brand/brand_logo_horizontal.png"
            alt="Shubh555"
            height={32}
          />
        </NavLink>

        <nav className="site-nav" aria-label="Primary">
          <ul className="nav-links">
            {NAV.map((item) => {
              const active = isItemActive(item, location.pathname, location.hash);
              const className = active ? "nav-link is-active" : "nav-link";

              if (item.kind === "hash") {
                return (
                  <li key={item.label}>
                    <a
                      href={`/#${item.hash}`}
                      className={className}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={() => className}
                  >
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          <button type="button" className="header-download" onClick={openApkDownload}>
            <Download size={17} strokeWidth={2.4} aria-hidden />
            <span>Download</span>
          </button>

          <button
            type="button"
            className="header-chrome-btn"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav-sheet"
          className="header-sheet open"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={() => setOpen(false)}
        >
          <div className="header-sheet-card" onClick={(e) => e.stopPropagation()}>
            <p className="header-sheet-label">Go to</p>
            <nav className="header-sheet-nav" aria-label="Mobile">
              {NAV.map((item) => {
                const active = isItemActive(item, location.pathname, location.hash);
                const className = active ? "sheet-link is-active" : "sheet-link";

                if (item.kind === "hash") {
                  return (
                    <a
                      key={item.label}
                      href={`/#${item.hash}`}
                      className={className}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={() => className}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <button
              type="button"
              className="header-download sheet-download"
              onClick={() => {
                setOpen(false);
                openApkDownload();
              }}
            >
              <Download size={18} strokeWidth={2.4} />
              <span>Download App</span>
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
