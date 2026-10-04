"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { AudioRecorder, AudioRecordResult } from "@/components/AudioRecorder";

interface FatihaRequest {
  id: number;
  requestLetter: string;
  audioRecord: string;
  status: number;
  isApproved: boolean;
  dateOfRecord: number;
  alQeratId?: number | null;
  alQeratName?: string | null;
}

interface Qerat {
  id: number;
  qeratName: string;
  audioFile?: string | null;
}

const STATUS_TEXT: Record<number, string> = { 0: "Open", 1: "Processing", 2: "Closed", 3: "Qualified" };
const STATUS_CLASS: Record<number, string> = { 0: "fh-status--open", 1: "fh-status--processing", 2: "fh-status--closed", 3: "fh-status--qualified" };
const STATUS_ICON: Record<number, string> = { 0: "fas fa-folder-open", 1: "fas fa-spinner", 2: "fas fa-lock", 3: "fas fa-award" };

export default function FatihaRequestsPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  const [items, setItems] = useState<FatihaRequest[]>([]);
  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [requestLetter, setLetter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedQeratId, setSelectedQeratId] = useState<number>(0);
  const [selectedQeratAudioUrl, setSelectedQeratAudioUrl] = useState<string | null>(null);
  const [audioResult, setAudioResult] = useState<AudioRecordResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, { comments: unknown[] }>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    api.get<FatihaRequest[]>("/api/fatiha-requests").then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!loading && !user) return;
    load();
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => setQerats([]));
  }, [user, loading, load]);

  function audioSrc(key?: string | null): string | null {
    if (!key) return null;
    if (/^https?:\/\//i.test(key)) return key;
    return API_URL + "/files/" + key.replace(/^\/+/, "");
  }

  function onQeratSelected(id: number) {
    setSelectedQeratId(id);
    const q = qerats.find((x) => x.id === id);
    setSelectedQeratAudioUrl(audioSrc(q?.audioFile) ?? null);
  }

  function handleAudioResult(r: AudioRecordResult) { setAudioResult(r); }
  function handleClearAudio() { setAudioResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestLetter.trim()) { setError(t("Please enter a request letter")); return; }
    if (!selectedQeratId) { setError(t("Please select a Qerat")); return; }
    if (!audioResult) { setError(t("Please provide an audio recording")); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData();
    form.append("requestLetter", requestLetter.trim());
    form.append("alQeratId", String(selectedQeratId));
    const audio = audioResult;
    form.append("audioRecord", audio.blob, audio.name);
    try {
      const res = await api.post("/api/fatiha-requests", form);
      if (res.success) {
        setSuccess(t("Fatiha request submitted successfully!"));
        setLetter(""); setSelectedQeratId(0); setSelectedQeratAudioUrl(null); setAudioResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        load();
      } else { setError(res.message || (t("Submission failed"))); }
    } catch (err: any) { setError(err.message || (t("Connection error"))); }
    finally { setBusy(false); }
  }

  async function loadDetails(id: number) {
    if (details[id]) return;
    try {
      const res = await api.get("/api/fatiha-requests/" + id);
      if (res.success && res.data) setDetails((prev) => ({ ...prev, [id]: { comments: (res.data as any).comments ?? [] } }));
    } catch { /* ignore */ }
  }

  async function toggleExpand(id: number) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id); await loadDetails(id);
  }

  async function deleteRequest(id: number) {
    if (!confirm(t("Delete this request?"))) return;
    try { await api.del("/api/fatiha-requests/" + id); setItems((prev) => prev.filter((r) => r.id !== id)); setSuccess(t("Deleted")); }
    catch (err: any) { setError(err.message || (t("Delete failed"))); }
  }

  const filtered = items.filter((r) => !search.trim() || r.requestLetter.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-file-signature"></i></span>
          <h1 className="fh-page__title">{t("Fatiha Requests")}</h1>
          <p className="fh-page__subtitle">{t("Apply for your Al-Fatiha Ijazah and track the status of your requests.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {success && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" /> {success}</div>}
        {error && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" /> {error}</div>}

        <div className="row g-4">
          {/* قائمة الطلبات */}
          <div className="col-lg-7">
            <div className="fh-card">
              <div className="fh-card__head">
                <i className="fas fa-list-check"></i>
                <h3>{t("My Requests")}</h3>
                <span className="badge bg-primary-subtle text-primary ms-auto">{items.length}</span>
              </div>
              <div className="fh-card__body">
                {items.length > 3 && (
                  <div className="mb-3 position-relative">
                    <i className="fas fa-search position-absolute text-muted" style={{ top: 14, insetInlineStart: 14 }}></i>
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingInlineStart: 40 }}
                      placeholder={t("Search...")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                )}
                {filtered.length === 0 ? (
                  <div className="fh-empty">
                    <i className="fas fa-inbox"></i>
                    <p className="mb-0">{t("No requests yet")}</p>
                  </div>
                ) : (
                  filtered.map((r) => (
                    <div key={r.id} className="fh-req">
                      <div className="fh-req__main">
                        <div className="fh-req__title">
                          <i className={`${STATUS_ICON[r.status] ?? "fas fa-question"} text-primary`} />
                          <span className="text-truncate">
                            {r.requestLetter.slice(0, 80)}{r.requestLetter.length > 80 ? "\u2026" : ""}
                          </span>
                        </div>
                        <div className="fh-req__meta">
                          <span><i className="fas fa-book-quran me-1"></i>{r.alQeratName ?? "\u2014"}</span>
                          <span><i className="fas fa-calendar me-1"></i>{new Date(r.dateOfRecord).toLocaleDateString(ar ? "ar-EG" : "en-US")}</span>
                          <span className={`fh-status ${STATUS_CLASS[r.status] ?? "fh-status--closed"}`}>
                            {t(STATUS_TEXT[r.status] ?? "Unknown")}
                          </span>
                        </div>
                        {expandedId === r.id && (
                          <div className="mt-3 pt-3 border-top">
                            <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>{r.requestLetter}</p>
                            {audioSrc(r.audioRecord) && <audio controls src={audioSrc(r.audioRecord)!} className="w-100 mt-2" />}
                          </div>
                        )}
                      </div>
                      <div className="fh-req__actions">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => toggleExpand(r.id)}>
                          {expandedId === r.id ? t("Hide") : t("Details")}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRequest(r.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* نموذج طلب جديد */}
          <div className="col-lg-5">
            <div className="fh-card">
              <div className="fh-card__head">
                <i className="fas fa-plus-circle"></i>
                <h3>{t("New Fatiha Request")}</h3>
              </div>
              <div className="fh-card__body">
                <form onSubmit={submitRequest}>
                  <div className="mb-3">
                    <label className="fh-label">{t("Request Letter")} <span className="req">*</span></label>
                    <textarea className="form-control" rows={4} required value={requestLetter} onChange={(e) => setLetter(e.target.value)} placeholder={t("Write your Fatiha request text here...")} />
                  </div>
                  <div className="mb-3">
                    <label className="fh-label">{t("Qirat (Quran Recitation)")} <span className="req">*</span></label>
                    <select className="form-select" value={selectedQeratId} onChange={(e) => onQeratSelected(Number(e.target.value))} required>
                      <option value={0} disabled>{t("Select a Qirat...")}</option>
                      {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
                    </select>
                    {selectedQeratAudioUrl && (
                      <div className="fh-media-box mt-2">
                        <label className="fh-label mb-2">{t("Selected Qirat Preview")}</label>
                        <audio controls src={selectedQeratAudioUrl} className="w-100" />
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <AudioRecorder onResult={handleAudioResult} onClear={handleClearAudio} required />
                  </div>
                  <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={busy}>
                      {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-1" />}
                      {t("Submit Request")}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setLetter(""); setSelectedQeratId(0); setSelectedQeratAudioUrl(null); setAudioResult(null); setError(""); setSuccess(""); }}>
                      {t("Cancel")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
