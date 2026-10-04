"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { CommentsThread } from "@/components/CommentsThread";
import { CertificateButton } from "@/components/CertificateButton";

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
interface Certificate { id: number; fatihaRequestId: number; }

const STATUS_TEXT: Record<number, string> = { 0: "Open", 1: "Processing", 2: "Closed", 3: "Qualified" };
const STATUS_CLASS: Record<number, string> = { 0: "fh-status--open", 1: "fh-status--processing", 2: "fh-status--closed", 3: "fh-status--qualified" };
const STATUS_ICON: Record<number, string> = { 0: "fas fa-folder-open", 1: "fas fa-spinner", 2: "fas fa-lock", 3: "fas fa-award" };

// مراحل مسار الطلب
const STEPS = [
  { key: "submitted", icon: "fas fa-paper-plane", label: "Submitted" },
  { key: "review", icon: "fas fa-magnifying-glass", label: "Under Review" },
  { key: "qualified", icon: "fas fa-award", label: "Qualified" },
  { key: "certified", icon: "fas fa-certificate", label: "Certified" },
];

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
  const [certByRequest, setCertByRequest] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const profileComplete = !!(user?.nameAr || user?.nameEn);

  const load = useCallback(() => {
    api.get<FatihaRequest[]>("/api/fatiha-requests").then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
    api.get<Certificate[]>("/api/account/certificates").then((r) => {
      const map: Record<number, number> = {};
      (r.data ?? []).forEach((cert) => { if (cert.fatihaRequestId) map[cert.fatihaRequestId] = cert.id; });
      setCertByRequest(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function deleteRequest(id: number) {
    if (!confirm(t("Delete this request?"))) return;
    try {
      await api.del("/api/fatiha-requests/" + id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      setSuccess(t("Deleted"));
    } catch (err: any) { setError(err.message || t("Delete failed")); }
  }

  const filtered = items.filter((r) => !search.trim() || r.requestLetter.toLowerCase().includes(search.toLowerCase()));
  const qualifiedItems = items.filter((r) => r.status === 3 || r.isApproved);
  const pendingExamItems = items.filter((r) => !(r.status === 3 || r.isApproved) && r.status !== 2);
  const showProfileBanner = qualifiedItems.length > 0 && !profileComplete;

  function currentStep(r: FatihaRequest): number {
    if (certByRequest[r.id] && profileComplete) return 3; // Certified
    if (r.status === 3 || r.isApproved) return 2; // Qualified
    if (r.status === 1) return 1; // Under review
    return 0; // Submitted
  }

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

        {showProfileBanner && (
          <div className="alert alert-warning rounded-4 d-flex align-items-center gap-3 flex-wrap">
            <i className="fas fa-triangle-exclamation fa-lg"></i>
            <div className="flex-grow-1">
              <strong>{t("Complete your profile to receive your certificate")}</strong>
              <div className="small">{t("Your certificate uses your name. Add your name in your profile to enable certificate download.")}</div>
            </div>
            <Link href="/profile" className="btn btn-warning btn-sm"><i className="fas fa-user-pen me-1" />{t("Complete Profile")}</Link>
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
          <Link href="/fatiha-requests/new" className="btn btn-primary">
            <i className="fas fa-plus me-1"></i>{t("New Request")}
          </Link>
          {pendingExamItems.length > 0 && (
            <Link href="/fatiha-exam" className="btn btn-outline-primary">
              <i className="fas fa-graduation-cap me-1"></i>{t("Take Qualifying Exam")}
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
                {filtered.map((r) => {
                  const step = currentStep(r);
                  const qualified = r.status === 3 || r.isApproved;
                  const certId = certByRequest[r.id];
                  return (
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

                      {/* مسار الطلب */}
                      <div className="fh-steps mt-3">
                        {STEPS.map((s, i) => (
                          <div key={s.key} className={`fh-step ${i <= step ? "fh-step--done" : ""} ${i === step ? "fh-step--active" : ""}`}>
                            <span className="fh-step__dot"><i className={s.icon}></i></span>
                            <span className="fh-step__label">{t(s.label)}</span>
                          </div>
                        ))}
                      </div>

                      {/* منطقة الإجراءات حسب الحالة */}
                      <div className="fh-actionbar mt-3">
                        {!qualified ? (
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Link href={`/fatiha-exam?requestId=${r.id}`} className="btn btn-sm btn-primary">
                              <i className="fas fa-graduation-cap me-1" />{t("Take Qualifying Exam")}
                            </Link>
                            <span className="text-muted small"><i className="fas fa-circle-info me-1" />{t("Pass the exam (60%+) to qualify and receive your certificate.")}</span>
                          </div>
                        ) : certId && profileComplete ? (
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="fh-status fh-status--qualified"><i className="fas fa-circle-check me-1" />{t("Certificate ready")}</span>
                            <CertificateButton certificateId={certId} />
                          </div>
                        ) : qualified && !profileComplete ? (
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="text-warning small"><i className="fas fa-triangle-exclamation me-1" />{t("Complete your profile name to download your certificate.")}</span>
                            <Link href="/profile" className="btn btn-sm btn-warning"><i className="fas fa-user-pen me-1" />{t("Complete Profile")}</Link>
                          </div>
                        ) : (
                          <span className="text-muted small"><i className="fas fa-hourglass-half me-1" />{t("Your certificate is being prepared.")}</span>
                        )}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
