"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

interface Qerat {
  id: number;
  qeratName: string;
}

export default function AuthorizedApplyPage() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const router = useRouter();
  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [form, setForm] = useState({
    briefOverview: "",
    description: "",
    academicQualifications: "",
    cv: "",
    alQeratId: "" as number | "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => {});
  }, []);

  function upd(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (form.alQeratId === "") {
      setError(ar ? "اختر القراءة" : "Select a Qiraat");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/authorized-users/apply", {
        briefOverview: form.briefOverview,
        description: form.description,
        academicQualifications: form.academicQualifications,
        cv: form.cv,
        alQeratId: Number(form.alQeratId),
      });
      setMsg(ar ? "تم إرسال طلبك بنجاح" : "Your application was submitted");
      setForm({ briefOverview: "", description: "", academicQualifications: "", cv: "", alQeratId: "" });
    } catch {
      setError(ar ? "فشل إرسال الطلب" : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <div className="container py-5 min-vh-100">{ar ? "جارٍ التحميل..." : "Loading..."}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="mx-auto" style={{ maxWidth: 640 }}>
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h3 className="fw-bold text-primary mb-3">{ar ? "طلب أن تصبح مُجازاً" : "Apply to become an Instructor"}</h3>
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{ar ? "نبذة مختصرة" : "Brief overview"}</label>
                <textarea className="form-control" rows={2} value={form.briefOverview} onChange={(e) => upd("briefOverview", e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{ar ? "الوصف" : "Description"}</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={(e) => upd("description", e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{ar ? "المؤهلات الأكاديمية" : "Academic qualifications"}</label>
                <input className="form-control" value={form.academicQualifications} onChange={(e) => upd("academicQualifications", e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{ar ? "رابط السيرة الذاتية" : "CV URL"}</label>
                <input className="form-control" value={form.cv} onChange={(e) => upd("cv", e.target.value)} placeholder="https://..." />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{ar ? "القراءة" : "Qiraat"}</label>
                <select className="form-select" value={form.alQeratId} onChange={(e) => upd("alQeratId", e.target.value)}>
                  <option value="">—</option>
                  {qerats.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.qeratName}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary w-100" disabled={busy}>
                {busy ? (ar ? "جارٍ الإرسال..." : "Submitting...") : ar ? "إرسال الطلب" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
