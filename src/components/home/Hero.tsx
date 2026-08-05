import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, MessageCircle } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import { useHeroCampaigns } from "../../hooks/useHeroCampaign";
import { useFestivalSkin } from "../../hooks/useFestivalSkin";
import { ResultBoard } from "./ResultBoard";
import type { HeroCampaign, HeroPhoneTone } from "../../lib/heroCampaigns";
import "./Hero.css";

interface HeroProps {
  supportNumber?: string;
}

const AUTOPLAY_MS = 6500;

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

function HeroSlide({
  campaign,
  supportNumber,
  festivalLabel,
  active,
}: {
  campaign: HeroCampaign;
  supportNumber: string;
  festivalLabel?: string;
  active: boolean;
}) {
  const { lead, accent } = brandParts(campaign.brand);
  const design = campaign.design;
  const showPhone = campaign.layout === "phone";
  const rows = campaign.phonePreview?.rows ?? [];
  const overlayOpacity = Math.min(100, Math.max(0, design.overlayOpacity ?? 72)) / 100;

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
    <article
      className={`hero-slide hero--align-${design.textAlign}${showPhone ? " hero--with-phone" : ""}${active ? " is-active" : ""}`}
      data-campaign={campaign.id}
      aria-hidden={!active}
    >
      <div className="hero-media" aria-hidden>
        <img
          className="hero-media-img"
          src={campaign.backgroundImage}
          alt=""
          width={1920}
          height={720}
          decoding="async"
          style={
            campaign.objectPosition
              ? { objectPosition: campaign.objectPosition }
              : undefined
          }
        />
        {/* Flat dark wash — CMS opacity maps 0–100% directly */}
        <div className="hero-media-overlay" style={{ opacity: overlayOpacity }} />
        {/* Bottom blend into page (not tied to opacity control) */}
        <div className="hero-media-fade" />
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
            <h1 className="hero-brand" id={active ? "hero-brand" : undefined}>
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
                tabIndex={active ? 0 : -1}
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
                tabIndex={active ? 0 : -1}
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
    </article>
  );
}

export function Hero({ supportNumber = "" }: HeroProps) {
  const { campaigns } = useHeroCampaigns();
  const festival = useFestivalSkin();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const multi = campaigns.length > 1;
  const safeIndex = Math.min(index, Math.max(0, campaigns.length - 1));
  const festivalLabel = festival
    ? festival.label || festivalFallbackLabel(festival.id)
    : undefined;

  useEffect(() => {
    setIndex(0);
  }, [campaigns]);

  const go = useCallback(
    (next: number) => {
      if (!campaigns.length) return;
      const len = campaigns.length;
      setIndex(((next % len) + len) % len);
    },
    [campaigns.length],
  );

  useEffect(() => {
    if (!multi || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % campaigns.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [multi, paused, campaigns.length]);

  if (!campaigns.length) return null;

  return (
    <section
      className={`hero${multi ? " hero--slider" : ""}`}
      aria-roledescription={multi ? "carousel" : undefined}
      aria-label="Hero banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="hero-slides">
        {campaigns.map((campaign, i) => (
          <HeroSlide
            key={campaign.id}
            campaign={campaign}
            supportNumber={supportNumber}
            festivalLabel={festivalLabel}
            active={i === safeIndex}
          />
        ))}
      </div>

      {multi ? (
        <div className="hero-slider-chrome">
          <button
            type="button"
            className="hero-slider-nav hero-slider-nav--prev"
            aria-label="Previous banner"
            onClick={() => go(safeIndex - 1)}
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>
          <div className="hero-slider-dots" role="tablist" aria-label="Banner slides">
            {campaigns.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Show banner ${c.brand || c.id}`}
                className={`hero-slider-dot${i === safeIndex ? " is-active" : ""}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="hero-slider-nav hero-slider-nav--next"
            aria-label="Next banner"
            onClick={() => go(safeIndex + 1)}
          >
            <ChevronRight size={20} strokeWidth={2.4} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
