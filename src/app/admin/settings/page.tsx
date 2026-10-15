"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface EmailSettingsData {
  from: string;
  fromName: string;
  default: { from: string; fromName: string };
  isCustom: boolean;
  sendgridConfigured: boolean;
  mediaBaseUrl: string;
}

interface AiSettingsData {
  configured: boolean;
  maskedKey: string;
  model: string;
  defaultModel: string;
  isCustom: boolean;
  envKey: boolean;
}

interface SchemaStatusData {
  ok: boolean;
  missingTables: string[];
  missingColumns: Array<{ migration: string; table: string; column: string }>;
  missingIndexes: Array<{ migration: string; name: string }>;
  totalMissing: number;
}

function SettingsInner() {
  const { t } = useI18n();
  const [data, setData] = useState<EmailSettingsData | null>(null);
  const [from, setFrom] = useState("");
  const [fromName, setFromName] = useState("");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [ai, setAi] = useState<AiSettingsData | null>(null);
  const [aiKey, setAiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [dbStatus, setDbStatus] = useState<SchemaStatusData | null>(null);
  const [dbBusy, setDbBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get<EmailSettingsData>("/api/settings/email")
      .then((r) => {
        setData(r.data ?? null);
        setFrom(r.data?.from ?? "");
        setFromName(r.data?.fromName ?? "");
      })
      .catch(() => setData(null));
    api
      .get<AiSettingsData>("/api/settings/ai")
      .then((r) => {
        setAi(r.data ?? null);
        setAiModel(r.data?.model ?? "");
      })
      .catch(() => setAi(null));
    api
      .get<SchemaStatusData>("/api/settings/schema")
      .then((r) => setDbStatus(r.data ?? null))
      .catch(() => setDbStatus(null));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(""); setErr("");
    try {
      await api.put("/api/settings/email", { from, fromName });
      setMsg(t("Settings saved"));
      load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Operation failed"));
    } finally { setBusy(false); }
  }

  async function reset() {
    setBusy(true); setMsg(""); setErr("");
    try {
      const r = await api.del<{ from: string; fromName: string }>("/api/settings/email");
      setMsg(t("Reset to default"));
      if (r.data) { setFrom(r.data.from); setFromName(r.data.fromName); }
      load();
    } catch { setErr(t("Operation failed")); }
    finally { setBusy(false); }
  }

  async function sendTest() {
    setBusy(true); setMsg(""); setErr("");
    try {
      await api.post("/api/settings/email/test", { to: testTo.trim() || undefined });
      setMsg(t("Test email sent"));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Test email failed"));
    } finally { setBusy(false); }
  }

  /** يحفظ مفتاح OpenRouter (يُخزَّن في KV ويُطبَّق فوراً على كل ميزات الذكاء الاصطناعي). */
  async function saveAi(e: React.FormEvent) {
    e.preventDefault();
    setAiBusy(true); setMsg(""); setErr("");
    try {
      const payload: { openrouterKey?: string; model?: string } = {};
      if (aiKey.trim()) payload.openrouterKey = aiKey.trim();
      if (aiModel.trim()) payload.model = aiModel.trim();
      if (!payload.openrouterKey && !payload.model) {
        setErr(t("Please enter a valid key"));
        return;
      }
      await api.put("/api/settings/ai", payload);
      setAiKey("");
      setMsg(t("AI key saved"));
      load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Operation failed"));
    } finally { setAiBusy(false); }
  }

  async function resetAi() {
    setAiBusy(true); setMsg(""); setErr("");
    try {
      await api.del("/api/settings/ai");
      setAiKey("");
      setMsg(t("Reset to default"));
      load();
    } catch { setErr(t("Operation failed")); }
    finally { setAiBusy(false); }
  }

  async function testAi() {
    setAiBusy(true); setMsg(""); setErr("");
    try {
      const r = await api.post<{ sample: string }>("/api/settings/ai/test", {});
      setMsg(`${t("Key is working")}${r.data?.sample ? ` — ${r.data.sample}` : ""}`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Key test failed"));
    } finally { setAiBusy(false); }
  }

  /** يفحص/يُطبّق ترحيلات قاعدة البيانات الناقصة (بلا wrangler). */
  async function runMigrate() {
    setDbBusy(true); setMsg(""); setErr("");
    try {
      const r = await api.post<{ ok: boolean; applied: string[]; skipped: string[]; errors: string[] }>("/api/settings/migrate", {});
      const applied = r.data?.applied?.length ?? 0;
      const errors = r.data?.errors ?? [];
      if (errors.length) {
        setErr(errors.slice(0, 3).join(" · "));
      } else {
        setMsg(`${t("Database updated successfully")}${applied ? ` (${applied})` : ""}`);
      }
      load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Operation failed"));
    } finally { setDbBusy(false); }
  }


  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-gear"></i></span>
          <h1 className="fh-page__title">{t("Settings")}</h1>
          <p className="fh-page__subtitle">{t("Sender email and media storage")}</p>
        </div>
      </header>

      <div className="fh-container" style={{ maxWidth: 860 }}>
        {msg && <div className="alert alert-success rounded-4">{msg}</div>}
        {err && <div className="alert alert-danger rounded-4">{err}</div>}

        <div className="fh-card mb-4">
          <div className="fh-card__head">
            <i className="fas fa-envelope"></i>
            <h3>{t("Email settings")}</h3>
          </div>
          <div className="fh-card__body">
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div className="p-3 rounded-4 flex-grow-1" style={{ background: "rgba(11,122,110,0.06)" }}>
                <div className="small text-muted">{t("Current sender")}</div>
                <div className="fw-bold" dir="ltr">{data?.from ?? "\u2014"}</div>
                <div className="small text-muted">{data?.fromName ?? ""}</div>
                <span className={`badge mt-2 ${data?.isCustom ? "bg-primary" : "bg-secondary"}`}>
                  {data?.isCustom ? t("Custom settings") : t("Using server defaults")}
                </span>
              </div>
              <div className="p-3 rounded-4 flex-grow-1" style={{ background: "rgba(11,122,110,0.06)" }}>
                <div className="small text-muted">SendGrid</div>
                <div className="fw-bold">
                  <i className={`fas ${data?.sendgridConfigured ? "fa-circle-check text-success" : "fa-circle-xmark text-danger"} me-2`} />
                  {data?.sendgridConfigured ? t("Active") : t("Unavailable")}
                </div>
                <div className="small text-muted mt-1" dir="ltr">{data?.default.from ?? ""}</div>
              </div>
            </div>

            <form onSubmit={save}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="fh-label">{t("Sender email")}</label>
                  <input className="form-control" type="email" value={from} onChange={(e) => setFrom(e.target.value)} required dir="ltr" />
                </div>
                <div className="col-md-6">
                  <label className="fh-label">{t("Sender name")}</label>
                  <input className="form-control" value={fromName} onChange={(e) => setFromName(e.target.value)} required />
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-save me-2" />}
                  {t("Save settings")}
                </button>
                <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={reset}>
                  <i className="fas fa-rotate-left me-2" />
                  {t("Reset to default")}
                </button>
              </div>
            </form>

            <hr className="my-4" />

            <div className="row g-3 align-items-end">
              <div className="col-md-8">
                <label className="fh-label">{t("Send test email")}</label>
                <input
                  className="form-control"
                  type="email"
                  dir="ltr"
                  placeholder={t("Email")}
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <button type="button" className="btn btn-outline-primary w-100" disabled={busy} onClick={sendTest}>
                  <i className="fas fa-paper-plane me-2" />
                  {t("Send test email")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="fh-card">
          <div className="fh-card__head">
            <i className="fas fa-cloud"></i>
            <h3>{t("Media storage (R2)")}</h3>
          </div>
          <div className="fh-card__body">
            <label className="fh-label">{t("Public media URL")}</label>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <code className="px-3 py-2 rounded-3 bg-light" dir="ltr">{data?.mediaBaseUrl || "\u2014"}</code>
              <Link className="btn btn-sm btn-outline-primary" href="/admin/certificates">
                <i className="fas fa-certificate me-1" />
                {t("Certificates")}
              </Link>
            </div>
            <p className="text-muted small mt-3 mb-0">
              {t("Files are stored in Cloudflare R2 and served through this custom domain.")}
            </p>
          </div>
        </div>

        {/* ── إعدادات الذكاء الاصطناعي (OpenRouter) ── */}
        <div className="fh-card mt-4">
          <div className="fh-card__head">
            <i className="fas fa-wand-magic-sparkles"></i>
            <h3>{t("AI settings")}</h3>
          </div>
          <div className="fh-card__body">
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div className="p-3 rounded-4 flex-grow-1" style={{ background: "rgba(11,122,110,0.06)" }}>
                <div className="small text-muted">{t("OpenRouter API key")}</div>
                <div className="fw-bold" dir="ltr">{ai?.maskedKey || "—"}</div>
                <div className="mt-2 d-flex flex-wrap gap-1">
                  <span className={`badge ${ai?.configured ? "bg-success" : "bg-danger"}`}>
                    {ai?.configured ? t("Active") : t("AI is not configured")}
                  </span>
                  <span className={`badge ${ai?.isCustom ? "bg-primary" : "bg-secondary"}`}>
                    {ai?.isCustom ? t("Custom settings") : t("Using server defaults")}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-4 flex-grow-1" style={{ background: "rgba(11,122,110,0.06)" }}>
                <div className="small text-muted">{t("Model")}</div>
                <div className="fw-bold" dir="ltr">{ai?.model || "—"}</div>
                <div className="small text-muted mt-1" dir="ltr">{ai?.defaultModel ?? ""}</div>
              </div>
            </div>

            <form onSubmit={saveAi}>
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="fh-label">{t("OpenRouter API key")}</label>
                  <input
                    className="form-control"
                    type="password"
                    dir="ltr"
                    autoComplete="off"
                    placeholder="sk-or-v1-…"
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                  />
                  <div className="form-text">{t("Leave empty to keep the current key")}</div>
                </div>
                <div className="col-md-5">
                  <label className="fh-label">{t("Model")}</label>
                  <input className="form-control" dir="ltr" value={aiModel} onChange={(e) => setAiModel(e.target.value)} />
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-4 align-items-center">
                <button className="btn btn-primary" disabled={aiBusy}>
                  {aiBusy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-save me-2" />}
                  {t("Save settings")}
                </button>
                <button type="button" className="btn btn-outline-primary" disabled={aiBusy} onClick={testAi}>
                  <i className="fas fa-plug-circle-check me-2" />
                  {t("Test connection")}
                </button>
                <button type="button" className="btn btn-outline-secondary" disabled={aiBusy} onClick={resetAi}>
                  <i className="fas fa-rotate-left me-2" />
                  {t("Reset to default")}
                </button>
                <a className="btn btn-link" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                  {t("Get your key from openrouter.ai")}
                </a>
              </div>
              <p className="text-muted small mt-3 mb-0">{t("Saved in KV — applied instantly without redeploying.")}</p>
            </form>
          </div>
        </div>

        {/* ── صحة قاعدة البيانات (ترحيلات) ── */}
        <div className="fh-card mt-4">
          <div className="fh-card__head">
            <i className="fas fa-database"></i>
            <h3>{t("Database")}</h3>
            <span className={`badge ms-auto ${dbStatus?.ok ? "bg-success" : "bg-warning text-dark"}`}>
              {dbStatus?.ok
                ? t("Database is up to date")
                : `${t("Missing columns")}: ${dbStatus?.totalMissing ?? 0}`}
            </span>
          </div>
          <div className="fh-card__body">
            {dbStatus && !dbStatus.ok ? (
              <ul className="small text-muted mb-3" dir="ltr">
                {dbStatus.missingTables.map((x) => <li key={`t-${x}`}>table: {x}</li>)}
                {dbStatus.missingColumns.map((x) => <li key={`c-${x.table}.${x.column}`}>[{x.migration}] {x.table}.{x.column}</li>)}
                {dbStatus.missingIndexes.map((x) => <li key={`i-${x.name}`}>[{x.migration}] index: {x.name}</li>)}
              </ul>
            ) : null}
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <button type="button" className="btn btn-primary" disabled={dbBusy} onClick={runMigrate}>
                {dbBusy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-wrench me-2" />}
                {t("Update database")}
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={dbBusy} onClick={load}>
                <i className="fas fa-rotate me-2" />
                {t("Reload")}
              </button>
            </div>
            <p className="text-muted small mt-3 mb-0">
              {t("Applies the missing columns/tables safely. Safe to run more than once.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <SettingsInner />
    </AdminGuard>
  );
}
