"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Subscriber {
  id: number;
  email: string;
  languageId?: number | null;
}

const LANGUAGES = [
  { id: 1, label: "English" },
  { id: 2, label: "Arabic" },
  { id: 3, label: "Chinese" },
  { id: 6, label: "French" },
];

function NewsletterInner() {
  const { t } = useI18n();
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [languageId, setLanguageId] = useState(2);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Subscriber[]>("/api/newsletter/subscribers").then((r) => setSubs(r.data ?? [])).catch(() => {});
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setBusy(true);
    try {
      await api.post("/api/newsletter", { subject, content, languageId });
      setMsg(t("Newsletter saved/sent successfully"));
      setSubject("");
      setContent("");
    } catch {
      setError(t("Send failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Newsletter")}</h2>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              {msg && <div className="alert alert-success">{msg}</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={send}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{t("Language")}</label>
                  <select className="form-select" value={languageId} onChange={(e) => setLanguageId(Number(e.target.value))}>
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {t(l.label)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{t("Subject")}</label>
                  <input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{t("Content")}</label>
                  <textarea className="form-control" rows={8} value={content} onChange={(e) => setContent(e.target.value)} required />
                </div>
                <button className="btn btn-primary" disabled={busy}>
                  <i className="fas fa-paper-plane me-2"></i>
                  {busy ? (t("Sending...")) : t("Send")}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body text-center">
              <i className="fas fa-users fa-2x text-primary mb-2"></i>
              <div className="display-6 fw-bold">{subs.length}</div>
              <p className="text-muted mb-0">{t("Subscribers")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterAdminPage() {
  return (
    <AdminGuard>
      <NewsletterInner />
    </AdminGuard>
  );
}
