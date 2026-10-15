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

function SettingsInner() {
  const { t } = useI18n();
  const [data, setData] = useState<EmailSettingsData | null>(null);
  const [from, setFrom] = useState("");
  const [fromName, setFromName] = useState("");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api
      .get<EmailSettingsData>("/api/settings/email")
      .then((r) => {
        setData(r.data ?? null);
        setFrom(r.data?.from ?? "");
        setFromName(r.data?.fromName ?? "");
      })
      .catch(() => setData(null));
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
