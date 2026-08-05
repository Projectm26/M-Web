import { Download, MessageCircle } from "lucide-react";
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

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function Hero({ supportNumber = "" }: HeroProps) {
  const { campaign } = useHeroCampaign();
  const festival = useFestivalSkin();
  const { lead, accent } = brandParts(campaign.brand);
  const design = campaign.design;
  const showPhone = campaign.layout === "phone";
  const rows = campaign.phonePreview?.rows ?? [];
  const festivalLabel = festival
    ? festival.label || festivalFallbackLabel(festival.id)
    : undefined;

  const overlay = Math.min(100, Math.max(0, design.overlayOpacity)) / 100;
  const shadeStyle = {
    background: `
      linear-gradient(
        100deg,
        rgb(18 12 9 / ${0.55 + overlay * 0.4}) 0%,
        rgb(22 15 11 / ${0.35 + overlay * 0.4}) 42%,
        rgb(22 15 11 / ${0.12 + overlay * 0.28}) 72%,
        rgb(22 15 11 / ${0.08 + overlay * 0.18}) 100%
      ),
      linear-gradient(to top, var(--color-bg) 0%, transparent 26%)
    `,
  };

  function onCta() {
    if (design.ctaAction === "none" || !design.showCta) return;
    if (design.ctaAction === "link" && design.ctaUrl) {
      window.open(design.ctaUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (design.ctaAction === "whatsapp") {
      const href = waLink(supportNumber);
      if (href) window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    openApkDownload();
  }

  const supportHref = design.showSupport ? waLink(supportNumber) : "";

  return (
    <section
      className={`hero hero--align-${design.textAlign}${showPhone ? " hero--with-phone" : ""}`}
      aria-labelledby={design.showBrand ? "hero-brand" : undefined}
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
        <div className="hero-media-shade" style={shadeStyle} />
      </div>

      <div className="hero-frame container">
        <div
          className="hero-copy"
          {...(festivalLabel ? { "data-festival-label": festivalLabel } : {})}
        >
          {design.showKicker && campaign.kicker ? (
            <p className="hero-kicker">{campaign.kicker}</p>
          ) : null}

          {design.showBrand ? (
            <h1 id="hero-brand" className="hero-brand">
              {lead}
              {accent ? <span className="hero-brand-accent">{accent}</span> : null}
            </h1>
          ) : null}

          {design.showTagline && campaign.tagline ? (
            <p className="hero-line">{campaign.tagline}</p>
          ) : null}

          <div className="hero-actions">
            {design.showCta && design.ctaAction !== "none" ? (
              <button
                type="button"
                className={`hero-cta hero-cta--${design.ctaStyle}`}
                onClick={onCta}
              >
                {design.ctaAction === "whatsapp" ? (
                  <MessageCircle size={18} strokeWidth={2.4} aria-hidden />
                ) : (
                  <Download size={18} strokeWidth={2.4} aria-hidden />
                )}
                {campaign.ctaLabel}
              </button>
            ) : null}

            {supportHref ? (
              <a
                className="hero-support"
                href={supportHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} strokeWidth={2.4} aria-hidden />
                WhatsApp
              </a>
            ) : null}
          </div>
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
