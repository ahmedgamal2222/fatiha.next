"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { CommentsThread } from "@/components/CommentsThread";

interface FatihaRequest {
  id: number;
  requestLetter: string;
  audioRecord: string;
  status: number;
  isApproved: boolean;
  dateOfRecord: number;
  alQeratId?: number | null;
  alQeratName?: string | null;
  commentsCount?: number;
}

const STATUS_TEXT: Record<number, string> = { 0: "Open", 1: "Processing", 2: "Closed", 3: "Qualified" };
const STATUS_CLASS: Record<number, string> = { 0: "fh-status--open", 1: "fh-status--processing", 2: "fh-status--closed", 3: "fh-status--qualified" };
const STATUS_ICON: Record<number, string> = { 0: "fas fa-folder-open", 1: "fas fa-spinner", 2: "fas fa-lock", 3: "fas fa-award" };

function audioSrc(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return API_URL + "/files/" + key.replace(/^\/+/, "");
}

export default function FatihaRequestsPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  const [items, setItems] = useState<FatihaRequest[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get<FatihaRequest[]>("/api/fatiha-requests").then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!loading && !user) return;
    if (user) load();
  }, [user, loading, load]);

  async function deleteRequest(id: number) {
    if (!confirm(t("Delete this request?"))) return;
    try {
      await api.del("/api/fatiha-requests/" + id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      setSuccess(t("Deleted"));
    } catch (err: any) { setError(err.message || t("Delete failed")); }
  }

  const filtered = items.filter((r) => !search.trim() || r.requestLetter.toLowerCase().includes(search.toLowerCase()));
  const hasQualified = items.some((r) => r.status === 3 || r.isApproved);

  if (!loading && !user) {
    return (
      <div className="fh-page"><div className="fh-container"><div className="fh-empty mt-5">
        <i className="fas fa-lock"></i>
        <p>{t("Please log in to view your requests.")}</p>
        <Link href="/login" className="btn btn-primary mt-2">{t("Log in")}</Link>
      </div></div></div>
    );
  }

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-file-signature"></i></span>
          <h1 className="fh-page__title">{t("My Fatiha Requests")}</h1>
          <p className="fh-page__subtitle">{t("Track the status of your requests, follow up with comments, and take the qualifying exam.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {success && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" /> {success}</div>}
        {error && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" /> {error}</div>}

        <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
          <Link href="/fatiha-requests/new" className="btn btn-primary">
            <i className="fas fa-plus me-1"></i>{t("New Request")}
          </Link>
          <Link href="/fatiha-exam" className="btn btn-outline-primary">
            <i className="fas fa-graduation-cap me-1"></i>{t("Take Qualifying Exam")}
          </Link>
          {hasQualified && (
            <Link href="/profile" className="btn btn-success">
              <i className="fas fa-certificate me-1"></i>{t("View Certificates")}
            </Link>
          )}
          {items.length > 3 && (
            <div className="position-relative ms-auto" style={{ minWidth: 220 }}>
              <i className="fas fa-search position-absolute text-muted" style={{ top: 11, insetInlineStart: 12 }}></i>
              <input type="text" className="form-control form-control-sm" style={{ paddingInlineStart: 34 }}
                placeholder={t("Search...")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        <div className="fh-card">
          <div className="fh-card__head">
            <i className="fas fa-list-check"></i>
            <h3>{t("My Requests")}</h3>
            <span className="badge bg-primary-subtle text-primary ms-auto">{items.length}</span>
          </div>
          <div className="fh-card__body">
            {filtered.length === 0 ? (
              <div className="fh-empty">
                <i className="fas fa-inbox"></i>
                <p className="mb-2">{t("No requests yet")}</p>
                <Link href="/fatiha-requests/new" className="btn btn-primary btn-sm">
                  <i className="fas fa-plus me-1"></i>{t("Create your first request")}
                </Link>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filtered.map((r) => (
                  <div key={r.id} className="fh-req" style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="fh-req__main">
                        <div className="fh-req__title">
                          <i className={`${STATUS_ICON[r.status] ?? "fas fa-question"} text-primary`} />
                          <span className="text-truncate">{r.requestLetter.slice(0, 80)}{r.requestLetter.length > 80 ? "…" : ""}</span>
                        </div>
                        <div className="fh-req__meta">
                          <span><i className="fas fa-book-quran me-1"></i>{r.alQeratName ?? "—"}</span>
                          <span><i className="fas fa-calendar me-1"></i>{new Date(r.dateOfRecord).toLocaleDateString(ar ? "ar-EG" : "en-US")}</span>
                          <span className={`fh-status ${STATUS_CLASS[r.status] ?? "fh-status--closed"}`}>
                            {t(STATUS_TEXT[r.status] ?? "Unknown")}
                          </span>
                          {!!r.commentsCount && <span><i className="fas fa-comments me-1"></i>{r.commentsCount}</span>}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          {expandedId === r.id ? t("Hide") : t("Details")}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRequest(r.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                    {expandedId === r.id && (
                      <div className="mt-3 pt-3 border-top">
                        <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>{r.requestLetter}</p>
                        {audioSrc(r.audioRecord) && (
                          <div className="fh-media-box mb-3">
                            <label className="fh-label mb-2"><i className="fas fa-microphone me-1" />{t("My Recitation")}</label>
                            <audio controls src={audioSrc(r.audioRecord)!} className="w-100" />
                          </div>
                        )}
                        <h6 className="fw-bold mt-3 mb-2"><i className="fas fa-comments me-1 text-primary" />{t("Comments")}</h6>
                        <CommentsThread requestId={r.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
