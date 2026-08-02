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
  showSupportLinks: true,
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
};

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

  return (
    <div className="cms-page">
      <header className="cms-top">
        <div>
          <p className="cms-eyebrow">Hero campaigns</p>
          <h1>Manage banners</h1>
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
          <article className="cms-card" key={c.id}>
            <div
              className="cms-card-thumb"
              style={{ backgroundImage: `url(${c.backgroundImage})` }}
            />
            <div className="cms-card-body">
              <div className="cms-card-meta">
                <strong>{c.id}</strong>
                <span className={c.active ? "cms-pill on" : "cms-pill"}>
                  {c.active ? "Active" : "Off"}
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
        setForm(found);
        setWatermarkText((found.watermark || []).join(","));
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

  const previewStyle = useMemo(
    () => ({
      backgroundImage: form.backgroundImage ? `url(${form.backgroundImage})` : undefined,
      backgroundPosition: form.objectPosition || "50% 40%",
    }),
    [form.backgroundImage, form.objectPosition],
  );

  function patch<K extends keyof CmsCampaign>(key: K, value: CmsCampaign[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    const payload: CmsCampaign = {
      ...form,
      id: form.id.trim(),
      watermark,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
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

  if (loading) return <div className="cms-page"><p className="cms-muted">Loading…</p></div>;

  return (
    <div className="cms-page">
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

          <div className="cms-row2">
            <label className="cms-check">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => patch("active", e.target.checked)}
              />
              Active
            </label>
            <label className="cms-check">
              <input
                type="checkbox"
                checked={form.showSupportLinks}
                onChange={(e) => patch("showSupportLinks", e.target.checked)}
              />
              Show WhatsApp
            </label>
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

          <label>
            Background image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => void onUpload(e.target.files?.[0] || null)}
            />
          </label>
          {form.backgroundImage ? (
            <p className="cms-muted cms-small">{form.backgroundImage}</p>
          ) : null}

          <label>
            Object position
            <input
              value={form.objectPosition || ""}
              onChange={(e) => patch("objectPosition", e.target.value)}
              placeholder="50% 40%"
            />
          </label>

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
          <label>
            CTA label
            <input value={form.ctaLabel} onChange={(e) => patch("ctaLabel", e.target.value)} />
          </label>
          <label>
            Watermark digits (comma-separated)
            <input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
          </label>

          {error ? <p className="cms-error">{error}</p> : null}
          <button type="submit" className="cms-btn cms-btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save campaign"}
          </button>
        </form>

        <aside className="cms-preview" style={previewStyle}>
          <div className="cms-preview-wash">
            <p className="cms-preview-kicker">{form.kicker || "Kicker"}</p>
            <h2>{form.brand || "Shubh555"}</h2>
            <p>{form.tagline || "Tagline preview"}</p>
            <span className="cms-preview-cta">{form.ctaLabel || "CTA"}</span>
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
