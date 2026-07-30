import { Download } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import "./PromoBanner.css";

export function PromoBanner() {
  return (
    <section className="promo-banner" aria-label="Download promotion">
      <img className="promo-banner-photo" src="/media/hero-atmosphere.jpg" alt="" aria-hidden />
      <div className="promo-banner-inner container">
        <div className="promo-banner-copy">
          <p className="promo-banner-kicker">Official Android app</p>
          <h2>Place bids where the boards light up</h2>
          <p className="promo-banner-sub">
            Watch results here. Bid Main, Night, Starline &amp; Lottery in the app.
          </p>
        </div>
        <button type="button" className="btn btn-primary promo-banner-cta" onClick={openApkDownload}>
          <Download size={18} />
          Get the App
        </button>
      </div>
    </section>
  );
}
