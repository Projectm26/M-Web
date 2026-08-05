import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  clearCmsKey,
  createCampaign,
  getCmsKey,
  listCampaigns,
  removeCampaign,
  setCmsKey,
  setDefaultCampaign,
  updateCampaign,
  uploadHeroImage,
  verifyCmsKey,
  type CmsCampaign,
} from "../lib/cmsApi";
import "./Cms.css";

const DEFAULT_DESIGN: CmsCampaign["design"] = {
  showKicker: false,
  showBrand: true,
  showTagline: true,
  showCta: true,
  showSupport: false,
  overlayOpacity: 72,
  textAlign: "left",
  ctaAction: "download",
  ctaUrl: "",
  ctaStyle: "solid",
};

const EMPTY: CmsCampaign = {
  id: "",
  active: true,
  startsAt: null,
  endsAt: null,
  priority: 20,
  kicker: "",
  brand: "Shubh555",
  tagline: "",
  ctaLabel: "Download Official App",
  showSupportLinks: false,
  backgroundImage: "",
  objectPosition: "50% 40%",
  layout: "image",
  watermark: ["5", "5", "5"],
  phonePreview: {
    rows: [
      { label: "Kalyan", result: "***-**-***", tone: "main" },
      { label: "Bombay Starline", result: "***-*", tone: "starline" },
      { label: "Bombay Jackpot", result: "**", tone: "jackpot" },
    ],
  },
  design: { ...DEFAULT_DESIGN },
};

function mergeCampaign(raw: CmsCampaign): CmsCampaign {
  return {
    ...EMPTY,
    ...raw,
    design: { ...DEFAULT_DESIGN, ...(raw.design || {}) },
    showSupportLinks: raw.design?.showSupport ?? raw.showSupportLinks ?? DEFAULT_DESIGN.showSupport,
  };
}

function parseObjectPosition(value: string | undefined): { x: number; y: number } {
  const match = (value || "50% 40%").match(/([\d.]+)%\s+([\d.]+)%/);
  if (!match) return { x: 50, y: 40 };
  return { x: Number(match[1]), y: Number(match[2]) };
}

function UnlockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verifyCmsKey(key.trim());
      setCmsKey(key.trim());
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cms-unlock">
      <form className="cms-unlock-card" onSubmit={submit}>
        <p className="cms-eyebrow">Shubh555 web</p>
        <h1>Hero CMS</h1>
        <p className="cms-muted">Enter the access key from your environment (`CMS_ACCESS_KEY`).</p>
        <label>
          Access key
          <input
            type="password"
            autoComplete="current-password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </label>
        {error ? <p className="cms-error">{error}</p> : null}
        <button type="submit" className="cms-btn cms-btn-primary" disabled={busy}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

function CampaignList() {
  const [campaigns, setCampaigns] = useState<CmsCampaign[]>([]);
  const [defaultId, setDefaultId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listCampaigns();
      setCampaigns(data.campaigns);
      setDefaultId(data.defaultCampaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onDelete(id: string) {
    if (!confirm(`Delete campaign “${id}”?`)) return;
    try {
      await removeCampaign(id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function onMakeDefault(id: string) {
    try {
      await setDefaultCampaign(id);
      setDefaultId(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onToggleActive(campaign: CmsCampaign) {
    try {
      const next = mergeCampaign({ ...campaign, active: !campaign.active });
      await updateCampaign(campaign.id, next);
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? next : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update banner");
    }
  }

  const activeCount = campaigns.filter((c) => c.active).length;

  return (
    <div className="cms-page">
      <header className="cms-top">
        <div>
          <p className="cms-eyebrow">Hero campaigns</p>
          <h1>Manage banners</h1>
          <p className="cms-muted cms-small" style={{ marginTop: 6 }}>
            Active banners rotate in a slider on the homepage. Disable a banner to hide it from the site.
            {campaigns.length ? ` · ${activeCount} live / ${campaigns.length} total` : ""}
          </p>
        </div>
        <div className="cms-top-actions">
          <Link to="/" className="cms-btn cms-btn-ghost">
            View site
          </Link>
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() => {
              clearCmsKey();
              navigate("/cms", { replace: true });
              window.location.reload();
            }}
          >
            Lock
          </button>
          <Link to="/cms/new" className="cms-btn cms-btn-primary">
            Add campaign
          </Link>
        </div>
      </header>

      {error ? <p className="cms-error">{error}</p> : null}
      {loading ? <p className="cms-muted">Loading…</p> : null}

      <div className="cms-grid">
        {campaigns.map((c) => (
          <article className={`cms-card${c.active ? "" : " is-disabled"}`} key={c.id}>
            <div
              className="cms-card-thumb"
              style={{ backgroundImage: `url(${c.backgroundImage})` }}
            />
            <div className="cms-card-body">
              <div className="cms-card-meta">
                <strong>{c.id}</strong>
                <span className={c.active ? "cms-pill on" : "cms-pill off"}>
                  {c.active ? "Enabled" : "Disabled"}
                </span>
                {defaultId === c.id ? <span className="cms-pill def">Default</span> : null}
              </div>
              <p className="cms-card-copy">{c.kicker || c.tagline || "—"}</p>
              <p className="cms-muted cms-small">
                Priority {c.priority} · {c.layout} · {c.startsAt || "…"} → {c.endsAt || "open"}
              </p>
              <div className="cms-card-actions">
                <Link to={`/cms/${encodeURIComponent(c.id)}`} className="cms-btn cms-btn-primary">
                  Edit
                </Link>
                <button
                  type="button"
                  className={`cms-btn ${c.active ? "cms-btn-ghost" : "cms-btn-primary"}`}
                  onClick={() => void onToggleActive(c)}
                >
                  {c.active ? "Disable" : "Enable"}
                </button>
                {defaultId !== c.id ? (
                  <button type="button" className="cms-btn cms-btn-ghost" onClick={() => onMakeDefault(c.id)}>
                    Set default
                  </button>
                ) : null}
                <button type="button" className="cms-btn cms-btn-danger" onClick={() => onDelete(c.id)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`cms-toggle${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="cms-toggle-track" aria-hidden>
        <span className="cms-toggle-thumb" />
      </span>
      <span className="cms-toggle-label">{label}</span>
    </button>
  );
}

function CampaignEditor({ mode }: { mode: "new" | "edit" }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<CmsCampaign>(EMPTY);
  const [watermarkText, setWatermarkText] = useState("5,5,5");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !routeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await listCampaigns();
        const found = data.campaigns.find((c) => c.id === routeId);
        if (!found) throw new Error("Campaign not found");
        if (cancelled) return;
        const merged = mergeCampaign(found);
        setForm(merged);
        setWatermarkText((merged.watermark || []).join(","));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, routeId]);

  const design = form.design || DEFAULT_DESIGN;
  const pos = useMemo(() => parseObjectPosition(form.objectPosition), [form.objectPosition]);

  const previewStyle = useMemo(
    () => ({
      backgroundImage: form.backgroundImage ? `url(${form.backgroundImage})` : undefined,
      backgroundPosition: form.objectPosition || "50% 40%",
    }),
    [form.backgroundImage, form.objectPosition],
  );

  const washStyle = useMemo(() => {
    const o = Math.min(100, Math.max(0, design.overlayOpacity)) / 100;
    return {
      background: `linear-gradient(180deg, rgb(14 9 7 / ${o * 0.25}) 0%, rgb(14 9 7 / ${o}) 100%)`,
      textAlign: design.textAlign as React.CSSProperties["textAlign"],
      alignItems:
        design.textAlign === "center"
          ? ("center" as const)
          : design.textAlign === "right"
            ? ("flex-end" as const)
            : ("flex-start" as const),
    };
  }, [design.overlayOpacity, design.textAlign]);

  function patch<K extends keyof CmsCampaign>(key: K, value: CmsCampaign[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchDesign<K extends keyof CmsCampaign["design"]>(key: K, value: CmsCampaign["design"][K]) {
    setForm((prev) => {
      const nextDesign = { ...(prev.design || DEFAULT_DESIGN), [key]: value };
      const next: CmsCampaign = { ...prev, design: nextDesign };
      if (key === "showSupport") {
        next.showSupportLinks = Boolean(value);
      }
      return next;
    });
  }

  function setObjectPos(axis: "x" | "y", value: number) {
    const next = axis === "x" ? { ...pos, x: value } : { ...pos, y: value };
    patch("objectPosition", `${next.x}% ${next.y}%`);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await uploadHeroImage(file);
      patch("backgroundImage", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const watermark = watermarkText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const nextDesign = { ...DEFAULT_DESIGN, ...(form.design || {}) };
    const payload: CmsCampaign = {
      ...form,
      id: form.id.trim(),
      watermark,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      design: nextDesign,
      showSupportLinks: nextDesign.showSupport,
    };
    try {
      if (!payload.id) throw new Error("Campaign id is required");
      if (!payload.backgroundImage) throw new Error("Upload a background image");
      if (mode === "new") await createCampaign(payload);
      else await updateCampaign(payload.id, payload);
      navigate("/cms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="cms-page">
        <p className="cms-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="cms-page cms-page--editor">
      <header className="cms-top">
        <div>
          <p className="cms-eyebrow">{mode === "new" ? "New" : "Edit"}</p>
          <h1>{mode === "new" ? "Add campaign" : form.id}</h1>
        </div>
        <Link to="/cms" className="cms-btn cms-btn-ghost">
          Back
        </Link>
      </header>

      <div className="cms-editor">
        <form className="cms-form" onSubmit={onSave}>
          <section className="cms-section">
            <header className="cms-section-head">
              <h2>Campaign meta</h2>
              <p>Identity, schedule, and layout.</p>
            </header>

            <label>
              Campaign id
              <input
                value={form.id}
                disabled={mode === "edit"}
                onChange={(e) => patch("id", e.target.value.replace(/\s+/g, "-").toLowerCase())}
                placeholder="festival-aug"
                required
              />
            </label>

            <div className="cms-toggle-row">
              <ToggleChip label="Active" checked={form.active} onChange={(v) => patch("active", v)} />
            </div>

            <div className="cms-row2">
              <label>
                Starts
                <input
                  type="date"
                  value={form.startsAt || ""}
                  onChange={(e) => patch("startsAt", e.target.value || null)}
                />
              </label>
              <label>
                Ends
                <input
                  type="date"
                  value={form.endsAt || ""}
                  onChange={(e) => patch("endsAt", e.target.value || null)}
                />
              </label>
            </div>

            <div className="cms-row2">
              <label>
                Priority
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => patch("priority", Number(e.target.value))}
                />
              </label>
              <label>
                Layout
                <select
                  value={form.layout}
                  onChange={(e) => patch("layout", e.target.value as "phone" | "image")}
                >
                  <option value="image">Image (full-bleed)</option>
                  <option value="phone">Phone mock</option>
                </select>
              </label>
            </div>
          </section>

          <section className="cms-section">
            <header className="cms-section-head">
              <h2>Media</h2>
              <p>Background image, crop position, and overlay wash.</p>
            </header>

            <label>
              Background image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => void onUpload(e.target.files?.[0] || null)}
              />
            </label>
            {form.backgroundImage ? (
              <p className="cms-muted cms-small cms-mono">{form.backgroundImage}</p>
            ) : null}

            <div className="cms-slider-block">
              <div className="cms-slider-head">
                <span>Position X</span>
                <strong>{pos.x}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={pos.x}
                onChange={(e) => setObjectPos("x", Number(e.target.value))}
              />
            </div>

            <div className="cms-slider-block">
              <div className="cms-slider-head">
                <span>Position Y</span>
                <strong>{pos.y}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={pos.y}
                onChange={(e) => setObjectPos("y", Number(e.target.value))}
              />
            </div>

            <div className="cms-slider-block">
              <div className="cms-slider-head">
                <span>Overlay opacity</span>
                <strong>{design.overlayOpacity}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={design.overlayOpacity}
                onChange={(e) => patchDesign("overlayOpacity", Number(e.target.value))}
              />
            </div>

            <fieldset className="cms-seg">
              <legend>Text align</legend>
              <div className="cms-seg-options">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    className={`cms-seg-btn${design.textAlign === align ? " is-active" : ""}`}
                    onClick={() => patchDesign("textAlign", align)}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="cms-section">
            <header className="cms-section-head">
              <h2>Content</h2>
              <p>Copy shown in the hero.</p>
            </header>

            <label>
              Kicker
              <input value={form.kicker} onChange={(e) => patch("kicker", e.target.value)} />
            </label>
            <label>
              Brand
              <input value={form.brand} onChange={(e) => patch("brand", e.target.value)} />
            </label>
            <label>
              Tagline
              <textarea
                rows={3}
                value={form.tagline}
                onChange={(e) => patch("tagline", e.target.value)}
              />
            </label>
          </section>

          <section className="cms-section">
            <header className="cms-section-head">
              <h2>Visibility</h2>
              <p>Toggle which hero elements appear.</p>
            </header>

            <div className="cms-toggle-grid">
              <ToggleChip
                label="Kicker"
                checked={design.showKicker}
                onChange={(v) => patchDesign("showKicker", v)}
              />
              <ToggleChip
                label="Brand"
                checked={design.showBrand}
                onChange={(v) => patchDesign("showBrand", v)}
              />
              <ToggleChip
                label="Tagline"
                checked={design.showTagline}
                onChange={(v) => patchDesign("showTagline", v)}
              />
              <ToggleChip
                label="CTA"
                checked={design.showCta}
                onChange={(v) => patchDesign("showCta", v)}
              />
              <ToggleChip
                label="Support / WhatsApp"
                checked={design.showSupport}
                onChange={(v) => patchDesign("showSupport", v)}
              />
            </div>
          </section>

          <section className="cms-section">
            <header className="cms-section-head">
              <h2>CTA</h2>
              <p>Button label, action, and style.</p>
            </header>

            <label>
              CTA label
              <input value={form.ctaLabel} onChange={(e) => patch("ctaLabel", e.target.value)} />
            </label>

            <div className="cms-row2">
              <label>
                Action
                <select
                  value={design.ctaAction}
                  onChange={(e) =>
                    patchDesign(
                      "ctaAction",
                      e.target.value as CmsCampaign["design"]["ctaAction"],
                    )
                  }
                >
                  <option value="download">Download</option>
                  <option value="link">Link</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="none">None</option>
                </select>
              </label>
              <label>
                Style
                <select
                  value={design.ctaStyle}
                  onChange={(e) =>
                    patchDesign(
                      "ctaStyle",
                      e.target.value as CmsCampaign["design"]["ctaStyle"],
                    )
                  }
                >
                  <option value="solid">Solid</option>
                  <option value="outline">Outline</option>
                  <option value="soft">Soft</option>
                </select>
              </label>
            </div>

            {design.ctaAction === "link" ? (
              <label>
                CTA URL
                <input
                  type="url"
                  value={design.ctaUrl}
                  onChange={(e) => patchDesign("ctaUrl", e.target.value)}
                  placeholder="https://"
                />
              </label>
            ) : null}
          </section>

          <details className="cms-section cms-section--advanced">
            <summary>
              <span>Advanced</span>
              <span className="cms-muted cms-small">Optional watermark digits</span>
            </summary>
            <label>
              Watermark digits (comma-separated)
              <input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
            </label>
          </details>

          {error ? <p className="cms-error">{error}</p> : null}
          <button type="submit" className="cms-btn cms-btn-primary cms-btn-save" disabled={busy}>
            {busy ? "Saving…" : "Save campaign"}
          </button>
        </form>

        <aside className="cms-preview" style={previewStyle}>
          <div className="cms-preview-wash" style={washStyle}>
            {design.showKicker ? (
              <p className="cms-preview-kicker">{form.kicker || "Kicker"}</p>
            ) : null}
            {design.showBrand ? <h2>{form.brand || "Shubh555"}</h2> : null}
            {design.showTagline ? <p>{form.tagline || "Tagline preview"}</p> : null}
            {design.showCta && design.ctaAction !== "none" ? (
              <span className={`cms-preview-cta cms-preview-cta--${design.ctaStyle}`}>
                {form.ctaLabel || "CTA"}
              </span>
            ) : null}
            {design.showSupport ? (
              <span className="cms-preview-support">WhatsApp support</span>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CmsPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const key = getCmsKey();
    if (!key) {
      setReady(true);
      return;
    }
    void verifyCmsKey(key)
      .then(() => setAuthed(true))
      .catch(() => clearCmsKey())
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="cms-shell">
        <p className="cms-muted" style={{ padding: 40 }}>
          Loading CMS…
        </p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="cms-shell">
        <UnlockScreen onUnlocked={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="cms-shell">
      <Routes>
        <Route index element={<CampaignList />} />
        <Route path="new" element={<CampaignEditor mode="new" />} />
        <Route path=":id" element={<CampaignEditor mode="edit" />} />
        <Route path="*" element={<Navigate to="/cms" replace />} />
      </Routes>
    </div>
  );
}
