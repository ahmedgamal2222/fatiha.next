"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Subscriber { id: number; email: string; languageId?: number | null; }
interface NewsItem { id: number; subject: string; content: string; languageId: number; isSent: boolean; date: number | string; }
interface SendResult { id: number; }
type WithMeta<T> = { data?: T; meta?: { sent?: number; failed?: number; total?: number } };

/** أسماء اللغات بحسب EnumCommon.Languagelist (id == languageName) — الـ 11 لغة. */
const LANGUAGE_NAMES: Record<number, string> = {
  1: "العربية", 2: "English", 3: "中文", 4: "Español", 5: "हिन्दी", 6: "Français",
  7: "Русский", 8: "বাংলা", 9: "Português", 10: "اردو", 11: "Bahasa Indonesia",
};
const LANGUAGE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function NewsletterInner() {
  const { t } = useI18n();
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [drafts, setDrafts] = useState<NewsItem[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [languageId, setLanguageId] = useState(1);
  // اللغات المستهدفة للإرسال — القائمة الفارغة تعني كل المشتركين
  const [targets, setTargets] = useState<number[]>([]);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get<Subscriber[]>("/api/newsletter/subscribers").then((r) => setSubs(r.data ?? [])).catch(() => setSubs([]));
    api.get<NewsItem[]>("/api/newsletter").then((r) => setDrafts(r.data ?? [])).catch(() => setDrafts([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  /** عدد المشتركين بلغة معيّنة (null = بلا لغة محدّدة). */
  function countFor(id: number | null) {
    return subs.filter((s) => (s.languageId ?? null) === id).length;
  }
  const targetCount = targets.length
    ? subs.filter((s) => typeof s.languageId === "number" && targets.includes(s.languageId)).length
    : subs.length;

  function toggleTarget(id: number) {
    setTargets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /** توليد نص النشرة بالذكاء الاصطناعي باللغة المختارة. */
  async function aiGenerate() {
    setAiBusy(true); setError(""); setMsg("");
    try {
      const r = await api.post<{ subject: string; content: string }>("/api/newsletter/generate", {
        languageId,
        topic: topic.trim() || undefined,
      });
      if (r.data) {
        setSubject(r.data.subject);
        setContent(r.data.content);
        setMsg(t("Generated with AI"));
      }
    } catch {
      setError(t("AI generation failed"));
    } finally {
      setAiBusy(false);
    }
  }

  /** إرسال نشرة محفوظة إلى اللغات المحدَّدة (أو الكل عند الفراغ). */
  async function sendDraft(id: number, languageIds: number[] = []) {
    if (!confirm(t("Do you want to send this newsletter now?"))) return;
    setBusy(true); setError(""); setMsg("");
    try {
      const r = (await api.post(`/api/newsletter/${id}/mark-sent`, { languageIds })) as WithMeta<SendResult>;
      const failed = r.meta?.failed ?? 0;
      setMsg(
        `${t("Sent")}: ${r.meta?.sent ?? 0} / ${t("Recipients")}: ${r.meta?.total ?? 0}` +
          (failed ? ` — ${t("Send failed")}: ${failed}` : "")
      );
      load();
    } catch {
      setError(t("Send failed"));
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent, sendNow: boolean) {
    e.preventDefault();
    setMsg(""); setError(""); setBusy(true);
    try {
      const created = await api.post<NewsItem>("/api/newsletter", { subject, content, languageId });
      const id = created.data?.id;
      if (sendNow && id !== undefined) {
        await sendDraft(id, targets);
      } else {
        setMsg(t("Newsletter saved/sent successfully"));
      }
      setSubject("");
      setContent("");
      load();
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
              <form onSubmit={(e) => save(e, true)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">{t("Language")}</label>
                    <select className="form-select" value={languageId} onChange={(e) => setLanguageId(Number(e.target.value))}>
                      {LANGUAGE_IDS.map((id) => (
                        <option key={id} value={id}>
                          {LANGUAGE_NAMES[id]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">{t("Topic (optional)")}</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={t("Topic (optional)")}
                      />
                      <button type="button" className="btn btn-outline-primary" onClick={aiGenerate} disabled={aiBusy}>
                        <i className="fas fa-wand-magic-sparkles me-1"></i>
                        {aiBusy ? t("Generating...") : t("Generate with AI")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-3 mt-3">
                  <label className="form-label fw-semibold small">{t("Subject")}</label>
                  <input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{t("Content")}</label>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("Write the newsletter content here...")}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold small">{t("Target languages")}</label>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm ${targets.length === 0 ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setTargets([])}
                    >
                      <i className="fas fa-globe me-1"></i>
                      {t("All subscribers")} ({subs.length})
                    </button>
                    {LANGUAGE_IDS.map((id) => {
                      const n = countFor(id);
                      const active = targets.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => toggleTarget(id)}
                          disabled={n === 0}
                          title={`${LANGUAGE_NAMES[id]} — ${n}`}
                        >
                          {LANGUAGE_NAMES[id]} <span className="badge bg-light text-dark ms-1">{n}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="form-text">
                    {t("Recipients")}: <strong>{targetCount}</strong>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary" disabled={busy}>
                    <i className="fas fa-paper-plane me-2"></i>
                    {busy ? t("Sending...") : t("Send now")}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={(e) => save(e, false)}>
                    <i className="fas fa-floppy-disk me-2"></i>
                    {t("Save as draft")}
                  </button>
                  <span className="align-self-center text-muted small">{t("Target languages")}: {targets.length ? targets.map((id) => LANGUAGE_NAMES[id]).join(", ") : t("All subscribers")}</span>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body text-center">
              <i className="fas fa-users fa-2x text-primary mb-2"></i>
              <div className="display-6 fw-bold">{subs.length}</div>
              <p className="text-muted mb-0">{t("Subscribers")}</p>
            </div>
            {subs.length > 0 && (
              <ul className="list-group list-group-flush small">
                {LANGUAGE_IDS.map((id) => (
                  <li key={id} className="list-group-item d-flex justify-content-between">
                    <span>{LANGUAGE_NAMES[id]}</span>
                    <span className="badge bg-light text-dark">{countFor(id)}</span>
                  </li>
                ))}
                {countFor(null) > 0 && (
                  <li className="list-group-item d-flex justify-content-between">
                    <span>{t("Uncategorized")}</span>
                    <span className="badge bg-light text-dark">{countFor(null)}</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">{t("Newsletter")}</h6>
              {drafts.length === 0 ? (
                <p className="text-muted small mb-0">{t("No data")}</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {drafts.map((d) => (
                    <li key={d.id} className="border-bottom py-2">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="fw-semibold small">{d.subject}</div>
                          <div className="text-muted small">
                            {LANGUAGE_NAMES[d.languageId] ?? "\u2014"}{" "}
                            <span className={`badge ${d.isSent ? "bg-success" : "bg-secondary"}`}>
                              {d.isSent ? t("Sent") : t("Draft")}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          disabled={busy}
                          onClick={() => sendDraft(d.id, targets)}
                          title={t("Send now")}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
