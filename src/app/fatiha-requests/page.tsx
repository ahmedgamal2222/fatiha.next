"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, API_URL, getToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

interface FatihaRequest {
  id: number;
  requestLetter: string;
  audioRecord: string;
  status: number;
  isApproved: boolean;
  dateOfRecord: number;
  alQeratId?: number | null;
}
interface Qerat {
  id: number;
  qeratName: string;
}

const STATUS: Record<number, { ar: string; en: string; cls: string }> = {
  0: { ar: "مفتوح", en: "Open", cls: "bg-secondary" },
  1: { ar: "قيد المعالجة", en: "Processing", cls: "bg-warning text-dark" },
  2: { ar: "مغلق", en: "Closed", cls: "bg-dark" },
  3: { ar: "مُجاز", en: "Qualified", cls: "bg-success" },
};

export default function FatihaRequestsPage() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const router = useRouter();
  const [items, setItems] = useState<FatihaRequest[]>([]);
  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [requestLetter, setLetter] = useState("");
  const [alQeratId, setQeratId] = useState<number | "">("");
  const [audioUrl, setAudioUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get<FatihaRequest[]>("/api/fatiha-requests").then((r) => setItems(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    load();
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => {});
  }, [user, load]);

  async function onAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "fatiha-audio");
    const res = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
      credentials: "include",
      body: form,
    });
    const json = await res.json();
    if (json?.data?.url) setAudioUrl(json.data.url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!audioUrl) {
      setError(ar ? "يرجى رفع التسجيل الصوتي" : "Please upload the audio");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/fatiha-requests", {
        requestLetter,
        audioRecord: audioUrl,
        alQeratId: alQeratId === "" ? undefined : Number(alQeratId),
      });
      setLetter("");
      setAudioUrl("");
      setQeratId("");
      load();
    } catch {
      setError(ar ? "فشل إرسال الطلب" : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <div className="container py-5 min-vh-100">{ar ? "جارٍ التحميل..." : "Loading..."}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "طلبات الفاتحة" : "Fatiha Requests"}</h2>
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{ar ? "طلب جديد" : "New request"}</h5>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{ar ? "خطاب الطلب" : "Request letter"}</label>
                  <textarea className="form-control" rows={3} value={requestLetter} onChange={(e) => setLetter(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{ar ? "القراءة" : "Qiraat"}</label>
                  <select className="form-select" value={alQeratId} onChange={(e) => setQeratId(e.target.value === "" ? "" : Number(e.target.value))}>
                    <option value="">—</option>
                    {qerats.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.qeratName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{ar ? "التسجيل الصوتي" : "Audio recording"}</label>
                  <input type="file" accept="audio/*" className="form-control" onChange={onAudio} />
                  {audioUrl && <audio controls src={audioUrl} className="w-100 mt-2" />}
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={busy}>
                  {busy ? (ar ? "جارٍ الإرسال..." : "Submitting...") : ar ? "إرسال" : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{ar ? "طلباتي" : "My requests"}</h5>
              {items.length === 0 ? (
                <p className="text-muted mb-0">{ar ? "لا توجد بيانات" : "No data"}</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {items.map((r) => (
                    <li key={r.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>#{r.id}</strong>
                        <span className={`badge ${STATUS[r.status]?.cls || "bg-secondary"}`}>
                          {STATUS[r.status]?.[ar ? "ar" : "en"] ?? r.status}
                        </span>
                      </div>
                      <p className="text-muted small mb-2 mt-1">{r.requestLetter.slice(0, 90)}</p>
                      {r.audioRecord && <audio controls src={r.audioRecord} className="w-100" />}
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
