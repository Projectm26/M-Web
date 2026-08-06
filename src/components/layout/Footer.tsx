import { Link } from "react-router-dom";
import { Download, MessageCircle } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import "./Footer.css";

interface FooterProps {
  supportNumber?: string;
}

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

const FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Markets", to: "/#markets" },
  { label: "Lottery", to: "/#lottery" },
  { label: "Rates", to: "/#rates" },
  { label: "Charts", to: "/chart" },
] as const;

export function Footer({ supportNumber = "" }: FooterProps) {
  const year = new Date().getFullYear();
  const phone = digits(supportNumber);

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="footer-top">
          <div className="footer-brand-block">
            <Link to="/" className="footer-brand" aria-label="Shubh555 home">
              <img
                className="footer-brand-logo-img"
                src="/brand/brand_logo_horizontal.png"
                alt="Shubh555"
                height={36}
              />
            </Link>
            <p className="footer-tagline">
              Live satta matka results, jodi–pana charts, and the official Shubh555 app.
            </p>
            <button type="button" className="footer-download" onClick={openApkDownload}>
              <Download size={16} strokeWidth={2.4} />
              Download Official App
            </button>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h3>Explore</h3>
              <ul>
                {FOOTER_LINKS.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith("/#") ? (
                      <a href={link.to}>{link.label}</a>
                    ) : (
                      <Link to={link.to}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col footer-col--support">
              <h3>Support</h3>
              {phone ? (
                <div className="footer-support">
                  <p className="footer-support-phone">{supportNumber}</p>
                  <div className="footer-support-actions">
                    <a
                      className="footer-support-btn footer-support-btn--wa"
                      href={`https://wa.me/${phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={15} strokeWidth={2.4} />
                      WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <p className="footer-support-empty">Support opens in the official app.</p>
              )}
            </div>

            <div className="footer-col footer-col--trust">
              <h3>Responsible play</h3>
              <div className="footer-trust">
                <a
                  className="footer-trust-link"
                  href="https://www.begambleaware.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="BeGambleAware"
                >
                  <img
                    src="/media/begambleaware.png"
                    alt="BeGambleAware.org"
                    width={148}
                    height={56}
                  />
                </a>
                <a
                  className="footer-trust-link"
                  href="https://www.gamblingtherapy.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Gambling Therapy"
                >
                  <img
                    src="/media/gambling-therapy.png"
                    alt="Gambling Therapy"
                    width={148}
                    height={56}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-credit">
            <span className="footer-credit-copy">© {year} Shubh555</span>
            <span className="footer-credit-dot" aria-hidden />
            <span className="footer-credit-rights">All rights reserved</span>
          </div>
          <p className="footer-credit-note">
            <span className="footer-credit-chip">Official</span>
            Web results are for reference — place satta bids only in the Android app.
          </p>
        </div>
      </div>
    </footer>
  );
}
