import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { openApkDownload } from "../../hooks/useHomeData";
import "./DownloadFab.css";

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
      aria-label="Download App"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={openApkDownload}
    >
      <Download size={20} aria-hidden />
      <span>Download App</span>
    </button>
  );
}
