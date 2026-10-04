"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api, API_URL } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface AuthorizedUser {
  id: number;
  applicationUserId: string;
  dateOfRequest: number;
  dateOfAuthorization?: number | null;
  description?: string | null;
  audioRecordingRequest?: string | null;
  briefOverview?: string | null;
  academicQualifications?: string | null;
  cv?: string | null;
  profileImg?: string | null;
  isAvailable: boolean;
  points: number;
  alQeratId: number;
  languageListSerialized?: string | null;
}

function fileSrc(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return API_URL + "/files/" + key.replace(/^\/+/, "");
}

function Inner() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<AuthorizedUser[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "authorized">("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api.get<AuthorizedUser[]>("/api/authorized-users", false).then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function authorize(id: number) {
    if (!confirm(t("Authorize this applicant as a certified instructor?"))) return;
    setBusyId(id); setMsg(""); setErr("");
    try {
      await api.post(`/api/authorized-users/${id}/authorize`, {});
      setMsg(t("Applicant authorized successfully"));
      load();
    } catch { setErr(t("Operation failed")); }
    finally { setBusyId(null); }
  }

  const filtered = items.filter((u) => {
    if (filter === "pending") return !u.dateOfAuthorization;
    if (filter === "authorized") return !!u.dateOfAuthorization;
    return true;
  });

  const counts = {
    all: items.length,
    pending: items.filter((u) => !u.dateOfAuthorization).length,
    authorized: items.filter((u) => !!u.dateOfAuthorization).length,
  };

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-user-graduate"></i></span>
          <h1 className="fh-page__title">{t("Ijazah Applications")}</h1>
          <p className="fh-page__subtitle">{t("Review instructor applications, listen to recordings, check CVs and authorize applicants.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {msg && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{msg}</div>}
        {err && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        <div className="fh-card mb-4">
          <div className="fh-card__body">
            <div className="d-flex flex-wrap gap-2">
              {(["pending", "authorized", "all"] as const).map((f) => (
                <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFilter(f)}>
                  {t(f === "pending" ? "Pending" : f === "authorized" ? "Authorized" : "All")}
                  <span className="badge bg-light text-dark ms-1">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="fh-card">
          <div className="fh-card__head">
            <i className="fas fa-list-check"></i>
            <h3>{t("Applications")}</h3>
            <span className="badge bg-primary-subtle text-primary ms-auto">{filtered.length}</span>
          </div>
          <div className="fh-card__body">
            {filtered.length === 0 ? (
              <div className="fh-empty"><i className="fas fa-inbox"></i><p className="mb-0">{t("No applications found")}</p></div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filtered.map((u) => (
                  <div key={u.id} className="fh-req" style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="d-flex gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fileSrc(u.profileImg) || "https://placehold.co/64x64?text=?"} alt=""
                          width={64} height={64} className="rounded-circle border" style={{ objectFit: "cover" }} />
                        <div className="fh-req__main">
                          <div className="fh-req__title">
                            <i className="fas fa-user text-primary" />
                            <span>#{u.id}</span>
                          </div>
                          <div className="fh-req__meta">
                            <span><i className="fas fa-calendar me-1"></i>{new Date(u.dateOfRequest).toLocaleDateString(ar ? "ar-EG" : "en-US")}</span>
                            <span><i className="fas fa-star me-1"></i>{u.points} {t("pts")}</span>
                            <span className={`fh-status ${u.dateOfAuthorization ? "fh-status--qualified" : "fh-status--processing"}`}>
                              {u.dateOfAuthorization ? t("Authorized") : t("Pending")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                          {expandedId === u.id ? t("Hide") : t("Details")}
                        </button>
                        {!u.dateOfAuthorization && (
                          <button className="btn btn-sm btn-success" disabled={busyId === u.id} onClick={() => authorize(u.id)}>
                            <i className="fas fa-user-check me-1" />{t("Authorize")}
                          </button>
                        )}
                      </div>
                    </div>
                    {expandedId === u.id && (
                      <div className="mt-3 pt-3 border-top d-flex flex-column gap-3">
                        {u.description && (
                          <div><label className="fh-label mb-1">{t("Description")}</label><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{u.description}</p></div>
                        )}
                        {u.briefOverview && (
                          <div><label className="fh-label mb-1">{t("Brief Overview")}</label><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{u.briefOverview}</p></div>
                        )}
                        {u.academicQualifications && (
                          <div><label className="fh-label mb-1">{t("Academic Qualifications")}</label><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{u.academicQualifications}</p></div>
                        )}
                        {u.languageListSerialized && (
                          <div>
                            <label className="fh-label mb-1">{t("Spoken Languages")}</label>
                            <div className="d-flex flex-wrap gap-2">
                              {u.languageListSerialized.split(",").filter(Boolean).map((l) => (
                                <span key={l} className="badge bg-primary-subtle text-primary">{l}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {fileSrc(u.audioRecordingRequest) && (
                          <div className="fh-media-box">
                            <label className="fh-label mb-2"><i className="fas fa-microphone me-1" />{t("Audio recording")}</label>
                            <audio controls src={fileSrc(u.audioRecordingRequest)!} className="w-100" />
                          </div>
                        )}
                        {fileSrc(u.cv) && (
                          <a href={fileSrc(u.cv)!} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary align-self-start">
                            <i className="fas fa-file-pdf me-1" />{t("View CV")}
                          </a>
                        )}
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

export default function AdminAuthorizedUsersPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
