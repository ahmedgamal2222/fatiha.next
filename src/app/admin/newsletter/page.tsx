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
  { id: 1, name: "English" },
  { id: 2, name: "العربية" },
  { id: 3, name: "中文" },
  { id: 6, name: "Français" },
];

function NewsletterInner() {
  const { lang } = useI18n();
  const ar = lang === "ar";
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
      setMsg(ar ? "تم حفظ/إرسال النشرة بنجاح" : "Newsletter saved/sent successfully");
      setSubject("");
      setContent("");
    } catch {
      setError(ar ? "فشل الإرسال" : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "النشرة البريدية" : "Newsletter"}</h2>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              {msg && <div className="alert alert-success">{msg}</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={send}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{ar ? "اللغة" : "Language"}</label>
                  <select className="form-select" value={languageId} onChange={(e) => setLanguageId(Number(e.target.value))}>
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{ar ? "الموضوع" : "Subject"}</label>
                  <input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{ar ? "المحتوى" : "Content"}</label>
                  <textarea className="form-control" rows={8} value={content} onChange={(e) => setContent(e.target.value)} required />
                </div>
                <button className="btn btn-primary" disabled={busy}>
                  <i className="fas fa-paper-plane me-2"></i>
                  {busy ? (ar ? "جارٍ الإرسال..." : "Sending...") : ar ? "إرسال" : "Send"}
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
              <p className="text-muted mb-0">{ar ? "المشتركون" : "Subscribers"}</p>
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
