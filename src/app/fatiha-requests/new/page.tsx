"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { AudioRecorder, AudioRecordResult } from "@/components/AudioRecorder";

interface Qerat { id: number; qeratName: string; audioFile?: string | null; }

export default function NewFatihaRequestPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [requestLetter, setLetter] = useState("");
  const [selectedQeratId, setSelectedQeratId] = useState<number>(0);
  const [audioResult, setAudioResult] = useState<AudioRecordResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => setQerats([]));
  }, [user, loading, router]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestLetter.trim()) { setError(t("Please enter a request letter")); return; }
    if (!selectedQeratId) { setError(t("Please select a Qerat")); return; }
    if (!audioResult) { setError(t("Please provide an audio recording")); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData();
    form.append("requestLetter", requestLetter.trim());
    form.append("alQeratId", String(selectedQeratId));
    form.append("audioRecord", audioResult.blob, audioResult.name);
    try {
      const res = await api.post("/api/fatiha-requests", form);
      if (res.success) {
        setSuccess(t("Fatiha request submitted successfully!"));
        setLetter(""); setSelectedQeratId(0); setAudioResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => router.push("/fatiha-requests"), 1500);
      } else { setError(res.message || t("Submission failed")); }
    } catch (err: any) { setError(err.message || t("Connection error")); }
    finally { setBusy(false); }
  }

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-feather-pointed"></i></span>
          <h1 className="fh-page__title">{t("New Fatiha Request")}</h1>
          <p className="fh-page__subtitle">{t("Submit your recitation and request letter to apply for an Al-Fatiha Ijazah.")}</p>
        </div>
      </header>

      <div className="fh-container" style={{ maxWidth: 720 }}>
        <div className="mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => router.push("/fatiha-requests")}>
            <i className="fas fa-arrow-right me-1" style={{ transform: "scaleX(-1)" }}></i>{t("Back to My Requests")}
          </button>
        </div>
        {success && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{success}</div>}
        {error && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{error}</div>}

        <div className="fh-card">
          <div className="fh-card__head"><i className="fas fa-plus-circle"></i><h3>{t("Request Details")}</h3></div>
          <div className="fh-card__body">
            <form onSubmit={submitRequest}>
              <div className="mb-3">
                <label className="fh-label">{t("Request Letter")} <span className="req">*</span></label>
                <textarea className="form-control" rows={5} required value={requestLetter}
                  onChange={(e) => setLetter(e.target.value)} placeholder={t("Write your Fatiha request text here...")} />
              </div>
              <div className="mb-3">
                <label className="fh-label">{t("Qirat (Quran Recitation)")} <span className="req">*</span></label>
                <select className="form-select" value={selectedQeratId} onChange={(e) => setSelectedQeratId(Number(e.target.value))} required>
                  <option value={0} disabled>{t("Select a Qirat...")}</option>
                  {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
                </select>
              </div>
              <div className="mb-3">
                <AudioRecorder onResult={setAudioResult} onClear={() => setAudioResult(null)} required />
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-1" />}
                  {t("Submit Request")}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => router.push("/fatiha-requests")}>
                  {t("Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
