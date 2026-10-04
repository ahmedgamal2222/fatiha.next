"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api, API_URL } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface FatihaRequest {
  id: number;
  requestLetter: string;
  audioRecord: string;
  status: number;
  isApproved: boolean;
  dateOfRecord: number;
  alQeratId?: number | null;
  alQeratName?: string | null;
  applicantName?: string | null;
}

const STATUSES = ["Open", "Processing", "Closed", "Qualified"] as const;
const STATUS_CLASS: Record<number, string> = { 0: "fh-status--open", 1: "fh-status--processing", 2: "fh-status--closed", 3: "fh-status--qualified" };
const STATUS_ICON: Record<number, string> = { 0: "fas fa-folder-open", 1: "fas fa-spinner", 2: "fas fa-lock", 3: "fas fa-award" };

function audioSrc(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return API_URL + "/files/" + key.replace(/^\/+/, "");
}

function Inner() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<FatihaRequest[]>([]);
  const [filter, setFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api.get<FatihaRequest[]>("/api/fatiha-requests").then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: number, status: string) {
    setBusyId(id); setMsg(""); setErr("");
    try {
      await api.patch(`/api/fatiha-requests/${id}/status`, { status });
      setMsg(t("Status updated"));
      load();
    } catch { setErr(t("Operation failed")); }
    finally { setBusyId(null); }
  }

  async function approve(id: number) {
    if (!confirm(t("Approve this request and issue a certificate?"))) return;
    setBusyId(id); setMsg(""); setErr("");
    try {
      await api.post(`/api/fatiha-requests/${id}/approve`, { points: 10 });
      setMsg(t("Request approved and certificate issued"));
      load();
    } catch { setErr(t("Operation failed")); }
    finally { setBusyId(null); }
  }

  async function remove(id: number) {
    if (!confirm(t("Delete this request?"))) return;
    setBusyId(id);
    try {
      await api.del(`/api/fatiha-requests/${id}`);
      setItems((prev) => prev.filter((r) => r.id !== id));
      setMsg(t("Deleted"));
    } catch { setErr(t("Delete failed")); }
    finally { setBusyId(null); }
  }

  const filtered = items.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.requestLetter.toLowerCase().includes(q) || (r.applicantName ?? "").toLowerCase().includes(q);
  });

  const counts = {
    all: items.length,
    0: items.filter((r) => r.status === 0).length,
    1: items.filter((r) => r.status === 1).length,
    2: items.filter((r) => r.status === 2).length,
    3: items.filter((r) => r.status === 3).length,
  };

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-clipboard-check"></i></span>
          <h1 className="fh-page__title">{t("Manage Fatiha Requests")}</h1>
          <p className="fh-page__subtitle">{t("Review submitted requests, update their status, approve them and issue certificates.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {msg && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{msg}</div>}
        {err && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        <div className="fh-card mb-4">
          <div className="fh-card__body">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <button className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFilter("all")}>
                {t("All")} <span className="badge bg-light text-dark ms-1">{counts.all}</span>
              </button>
              {STATUSES.map((s, i) => (
                <button key={s} className={`btn btn-sm ${filter === i ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFilter(i)}>
                  {t(s)} <span className="badge bg-light text-dark ms-1">{counts[i as 0 | 1 | 2 | 3]}</span>
                </button>
              ))}
              <div className="position-relative ms-auto" style={{ minWidth: 220 }}>
                <i className="fas fa-search position-absolute text-muted" style={{ top: 11, insetInlineStart: 12 }}></i>
                <input type="text" className="form-control form-control-sm" style={{ paddingInlineStart: 34 }}
                  placeholder={t("Search by text or applicant...")} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="fh-card">
          <div className="fh-card__head">
            <i className="fas fa-list-check"></i>
            <h3>{t("Requests")}</h3>
            <span className="badge bg-primary-subtle text-primary ms-auto">{filtered.length}</span>
          </div>
          <div className="fh-card__body">
            {filtered.length === 0 ? (
              <div className="fh-empty"><i className="fas fa-inbox"></i><p className="mb-0">{t("No requests found")}</p></div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filtered.map((r) => (
                  <div key={r.id} className="fh-req" style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="fh-req__main">
                        <div className="fh-req__title">
                          <i className={`${STATUS_ICON[r.status] ?? "fas fa-question"} text-primary`} />
                          <span>#{r.id} — {r.applicantName ?? t("Unknown")}</span>
                        </div>
                        <div className="fh-req__meta">
                          <span><i className="fas fa-book-quran me-1"></i>{r.alQeratName ?? "\u2014"}</span>
                          <span><i className="fas fa-calendar me-1"></i>{new Date(r.dateOfRecord).toLocaleDateString(ar ? "ar-EG" : "en-US")}</span>
                          <span className={`fh-status ${STATUS_CLASS[r.status] ?? "fh-status--closed"}`}>{t(STATUSES[r.status] ?? "Unknown")}</span>
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        <select className="form-select form-select-sm" style={{ width: "auto" }} value={STATUSES[r.status]}
                          disabled={busyId === r.id || r.isApproved}
                          onChange={(e) => changeStatus(r.id, e.target.value)}>
                          {STATUSES.map((s) => (<option key={s} value={s}>{t(s)}</option>))}
                        </select>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          {expandedId === r.id ? t("Hide") : t("Details")}
                        </button>
                        {!r.isApproved && (
                          <button className="btn btn-sm btn-success" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                            <i className="fas fa-award me-1" />{t("Approve")}
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline-danger" disabled={busyId === r.id} onClick={() => remove(r.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                    {expandedId === r.id && (
                      <div className="mt-3 pt-3 border-top">
                        <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>{r.requestLetter}</p>
                        {audioSrc(r.audioRecord) && (
                          <div className="fh-media-box">
                            <label className="fh-label mb-2"><i className="fas fa-microphone me-1" />{t("Recitation Recording")}</label>
                            <audio controls src={audioSrc(r.audioRecord)!} className="w-100" />
                          </div>
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

export default function AdminFatihaRequestsPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
