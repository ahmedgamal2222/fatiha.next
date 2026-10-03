"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
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
const STATUS_ICON: Record<number, string> = { 0: "fas fa-folder-open text-primary", 1: "fas fa-spinner text-warning", 2: "fas fa-lock text-secondary", 3: "fas fa-award text-success" };

export default function FatihaRequestsPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  const [items, setItems] = useState<FatihaRequest[]>([]);
  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [requestLetter, setLetter] = useState("");
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

  return (
    <div className="container py-4 min-vh-100 bg-light" style={{ marginTop: 80, marginBottom: 40 }}>
      <h2 className="shadow p-3 mb-4 rounded text-center" style={{ backgroundColor: "#263a5d", color: "white", fontFamily: '"18 Khebrat Musamim Regular", sans-serif', fontSize: "1.6rem", lineHeight: "1.25em" }}>
        {t("Fatiha Requests")}
      </h2>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <input type="text" className="form-control" placeholder={t("Search...")} value={requestLetter} onChange={(e) => setLetter(e.target.value)} style={{ maxWidth: 320 }} />
        <Link href="/fatiha-hero" className="btn btn-outline-secondary"><i className="fas fa-home me-1" /> {t("Home")}</Link>
      </div>
      <div className="mb-4">
        <h5 className="mb-3">{t("My Requests")}</h5>
        {items.length === 0 ? (
          <p className="text-muted fst-italic">{t("No requests yet")}</p>
        ) : (
          <div className="list-group">
            {items.map((r) => (
              <div key={r.id} className="list-group-item list-group-item-action shadow-sm rounded">
                <div className="d-flex justify-content-between align-items-start w-100">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={STATUS_ICON[r.status as keyof typeof STATUS_ICON] ?? "fas fa-question"} style={{ fontSize: "1.1rem" }} />
                      <span className="fw-bold">{r.requestLetter.slice(0, 80)}{r.requestLetter.length > 80 ? "\u2026" : ""}</span>
                    </div>
                    <div className="text-muted small mb-1">
                      {(t("Qerat: ")) + (r.alQeratName ?? "\u2014")} &middot; {new Date(r.dateOfRecord).toLocaleDateString(ar ? "ar-EG" : "en-US")} &middot; {(t("Status: ")) + t(STATUS_TEXT[r.status] ?? "Unknown")}
                      {r.isApproved && <span className="badge bg-success ms-1">{t("Approved")}</span>}
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => toggleExpand(r.id)}>{expandedId === r.id ? (t("Hide")) : (t("Details"))}</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRequest(r.id)}><i className="fas fa-trash me-1" /> {t("Delete")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card shadow-sm border-0 rounded-4 mt-4">
        <div className="card-body p-4">
          <h5 className="mb-3">{t("New Fatiha Request")}</h5>
          <form onSubmit={submitRequest}>
            <div className="mb-3">
              <label className="form-label fw-semibold">{t("Request Letter")} *</label>
              <textarea className="form-control" rows={4} required value={requestLetter} onChange={(e) => setLetter(e.target.value)} placeholder={t("Write your Fatiha request text here...")} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">{t("Qirat (Quran Recitation)")} *</label>
              <select className="form-control" value={selectedQeratId} onChange={(e) => onQeratSelected(Number(e.target.value))} required>
                <option value={0} disabled>{t("Select a Qirat...")}</option>
                {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
              </select>
            </div>
            {selectedQeratAudioUrl && (
              <div className="mb-3 p-2 bg-light rounded border">
                <label className="form-label small fw-semibold">{t("Selected Qirat Preview")}</label>
                <audio controls src={selectedQeratAudioUrl} className="w-100" />
              </div>
            )}
            <AudioRecorder onResult={handleAudioResult} onClear={handleClearAudio} required />
            {audioResult && (
              <div className="mt-2">
                <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleClearAudio}>{t("Remove recording")}</button>
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center mt-4 gap-2">
              <div />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setLetter(""); setSelectedQeratId(0); setSelectedQeratAudioUrl(null); setAudioResult(null); setError(""); setSuccess(""); }}>{t("Cancel")}</button>
                <button type="submit" className="btn btn-primary px-4" disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-1" />}
                  {t("Submit Request")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {success && <div className="alert alert-success mt-3 rounded-4" style={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}><i className="fas fa-check-circle me-2" /> {success}</div>}
      {error && <div className="alert alert-danger mt-3 rounded-4" style={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}><i className="fas fa-exclamation-circle me-2" /> {error}</div>}
    </div>
  );
}
