import { useEffect, useState } from "react";
import { openApkDownload } from "../../hooks/useHomeData";
import "./DownloadFab.css";

function AndroidIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.59.59 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.59.59 0 0 0-.83-.22c-.3.16-.42.54-.26.85l1.84 3.18C4.19 11.22 2.5 14.25 2.5 17.75c0 .28.22.5.5.5h18c.28 0 .5-.22.5-.5 0-3.5-1.69-6.53-3.9-8.27ZM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
    </svg>
  );
}

export function DownloadFab() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const band = document.querySelector(".download-band");
    const footer = document.querySelector(".site-footer");
    if (!band && !footer) return;

    const io = new IntersectionObserver(
      (entries) => {
        setHidden(entries.some((e) => e.isIntersecting));
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    if (band) io.observe(band);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <button
      type="button"
      className={`download-fab${hidden ? " is-hidden" : ""}`}
      aria-label="Download APK"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={openApkDownload}
    >
      <AndroidIcon size={18} />
      <span>Download APK</span>
    </button>
  );
}
