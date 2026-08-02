import { Download } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import "./DownloadBand.css";

export function DownloadBand() {
  return (
    <section className="download-band" aria-labelledby="download-band-title">
      <div className="download-band-bg" aria-hidden>
        <img
          className="download-band-photo"
          src="/media/hero-atmosphere.jpg"
          alt=""
          width={1920}
          height={1080}
          decoding="async"
        />
        <span className="download-band-wash" />
        <span className="download-band-glow download-band-glow--a" />
        <span className="download-band-glow download-band-glow--b" />
        <span className="download-band-mark">555</span>
      </div>

      <div className="container download-band-inner">
        <div className="download-band-copy">
          <p className="download-band-kicker">Official Android app</p>
          <h2 id="download-band-title" className="download-band-brand">
            Shubh<span>555</span>
          </h2>
          <p className="download-band-lead">
            Bid on Main, Night, Bombay Starline, Bombay Jackpot &amp; Lottery with wallet, charts, and support in
            one place.
          </p>
          <p className="download-band-meta">
            <span>Bidding</span>
            <span aria-hidden>·</span>
            <span>Wallet</span>
            <span aria-hidden>·</span>
            <span>Charts</span>
            <span aria-hidden>·</span>
            <span>Support</span>
          </p>
        </div>

        <div className="download-band-cta">
          <button type="button" className="download-band-btn" onClick={openApkDownload}>
            <Download size={18} strokeWidth={2.4} />
            Download Official App
          </button>
          <p className="download-band-note">Free APK · Same boards as this site</p>
        </div>
      </div>
    </section>
  );
}
