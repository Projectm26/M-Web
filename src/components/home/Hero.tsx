import { Download } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import { useHeroCampaign } from "../../hooks/useHeroCampaign";
import { useFestivalSkin } from "../../hooks/useFestivalSkin";
import { ResultBoard } from "./ResultBoard";
import type { HeroPhoneTone } from "../../lib/heroCampaigns";
import "./Hero.css";

interface HeroProps {
  supportNumber?: string;
}

function brandParts(brand: string) {
  const match = brand.match(/^(.*?)(555)$/);
  if (match) return { lead: match[1], accent: match[2] };
  return { lead: brand, accent: "" };
}

function rowToneClass(tone?: HeroPhoneTone) {
  if (tone === "starline") return "hero-app-row--star";
  if (tone === "jackpot") return "hero-app-row--jack";
  if (tone === "night") return "hero-app-row--night";
  return "hero-app-row--main";
}

function festivalFallbackLabel(id: string): string {
  switch (id) {
    case "diwali":
      return "Shubh Diwali";
    case "ganesh":
      return "Shubh Ganesh";
    case "navratri":
      return "Shubh Navratri";
    case "rakhi":
      return "Shubh Rakhi";
    default:
      return "Shubh";
  }
}

export function Hero(_props: HeroProps) {
  const { campaign } = useHeroCampaign();
  const festival = useFestivalSkin();
  const { lead, accent } = brandParts(campaign.brand);
  const showPhone = campaign.layout === "phone";
  const rows = campaign.phonePreview?.rows ?? [];
  const festivalLabel = festival
    ? festival.label || festivalFallbackLabel(festival.id)
    : undefined;

  return (
    <section
      className={`hero${showPhone ? " hero--with-phone" : ""}`}
      aria-labelledby="hero-brand"
      data-campaign={campaign.id}
    >
      <div className="hero-media" aria-hidden>
        <img
          className="hero-media-img"
          src={campaign.backgroundImage}
          alt=""
          width={1920}
          height={1080}
          decoding="async"
          style={
            campaign.objectPosition
              ? { objectPosition: campaign.objectPosition }
              : undefined
          }
        />
        <div className="hero-media-shade" />
      </div>

      <div className="hero-frame container">
        <div
          className="hero-copy"
          {...(festivalLabel ? { "data-festival-label": festivalLabel } : {})}
        >
          <h1 id="hero-brand" className="hero-brand">
            {lead}
            {accent ? <span className="hero-brand-accent">{accent}</span> : null}
          </h1>

          {campaign.tagline ? (
            <p className="hero-line">{campaign.tagline}</p>
          ) : null}

          <button
            type="button"
            className="hero-cta"
            onClick={openApkDownload}
          >
            <Download size={18} strokeWidth={2.4} aria-hidden />
            {campaign.ctaLabel}
          </button>
        </div>

        {showPhone ? (
          <div className="hero-device" aria-hidden>
            <div className="hero-device-shell">
              <div className="hero-device-screen">
                <div className="hero-device-bar">
                  <img
                    className="hero-device-logo"
                    src="/brand/brand_logo_horizontal.png"
                    alt=""
                    height={20}
                  />
                </div>
                <div className="hero-device-list">
                  {rows.slice(0, 3).map((row) => (
                    <div
                      className={`hero-device-row ${rowToneClass(row.tone)}`}
                      key={`${row.label}-${row.result}`}
                    >
                      <span>{row.label}</span>
                      <ResultBoard value={row.result} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
