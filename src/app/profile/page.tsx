"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { api } from "@/lib/api";
import { CertificateButton } from "@/components/CertificateButton";

interface PointsData {
  total: number;
  logs: { id: number; points: number; dateOfRecord: number }[];
}
interface Certificate {
  id: number;
  dateOfIssue: number;
  pdfUrl: string | null;
}
interface ProfileData {
  nameAr?: string | null;
  nameEn?: string | null;
  mobile?: string | null;
  gender?: string | null;
  dateOfBirth?: number | null;
  countryId?: number | null;
  jobCode?: string | null;
  preferredCulture?: string | null;
}
interface Country { id: number; arCountryName?: string | null; enCountryName?: string | null; }
interface Job { jobCode: string; jobTitleAr?: string | null; jobTitleEn?: string | null; }

const CULTURES = [
  { code: "ar-SA", label: "العربية" },
  { code: "en-US", label: "English" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
  { code: "ur-PK", label: "اردو" },
  { code: "id-ID", label: "Bahasa Indonesia" },
];

function toDateInput(ts?: number | null): string {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const router = useRouter();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<ProfileData>({});

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get<PointsData>("/api/account/points").then((r) => setPoints(r.data ?? null)).catch(() => {});
    api.get<Certificate[]>("/api/account/certificates").then((r) => setCerts(r.data ?? [])).catch(() => {});
    api.get<ProfileData>("/api/account/profile").then((r) => {
      if (r.data) setForm({
        nameAr: r.data.nameAr ?? "",
        nameEn: r.data.nameEn ?? "",
        mobile: r.data.mobile ?? "",
        gender: r.data.gender ?? "",
        dateOfBirth: r.data.dateOfBirth ?? null,
        countryId: r.data.countryId ?? null,
        jobCode: r.data.jobCode ?? "",
        preferredCulture: r.data.preferredCulture ?? "",
      });
    }).catch(() => {});
    api.get<Country[]>("/api/reference/countries", false).then((r) => setCountries(r.data ?? [])).catch(() => {});
    api.get<Job[]>("/api/reference/jobs", false).then((r) => setJobs(r.data ?? [])).catch(() => {});
  }, [user]);

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.upload("/api/account/profile/image", fd);
      setMsg(t("Image updated"));
      await refresh();
    } catch { setErr(t("Upload failed")); }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(""); setErr("");
    const payload: Record<string, unknown> = {
      nameAr: form.nameAr || undefined,
      nameEn: form.nameEn || undefined,
      mobile: form.mobile || undefined,
      gender: form.gender || undefined,
      countryId: form.countryId || undefined,
      jobCode: form.jobCode || undefined,
      preferredCulture: form.preferredCulture || undefined,
    };
    const dob = (document.getElementById("dob") as HTMLInputElement | null)?.value;
    if (dob) payload.dateOfBirth = dob;
    try {
      await api.put("/api/account/profile", payload);
      setMsg(t("Profile updated successfully"));
      await refresh();
    } catch { setErr(t("Operation failed")); }
    finally { setSaving(false); }
  }

  if (loading || !user) return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-user-circle"></i></span>
          <h1 className="fh-page__title">{t("Profile")}</h1>
          <p className="fh-page__subtitle">{t("Manage your personal information, points and certificates.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {msg && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{msg}</div>}
        {err && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="fh-card mb-4">
              <div className="fh-card__body text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.profileImageUrl || "https://placehold.co/120x120?text=?"} alt=""
                  width={120} height={120} className="rounded-circle border mb-3" style={{ objectFit: "cover" }} />
                <h5 className="fw-bold mb-1">{user.nameAr || user.nameEn || user.email}</h5>
                <p className="text-muted mb-2 small">{user.email}</p>
                <span className="badge bg-primary-subtle text-primary mb-3">{user.role}</span>
                <label className="fh-label text-start">{t("Change image")}</label>
                <input type="file" accept="image/*" onChange={onImage} className="form-control" />
                <div className="mt-3 text-start">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>{t("Completion")}</span><span>{user.profileCompletionPercentage ?? 0}%</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-primary" style={{ width: `${user.profileCompletionPercentage ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="fh-card mb-4">
              <div className="fh-card__head"><i className="fas fa-star"></i><h3>{t("Points")}</h3></div>
              <div className="fh-card__body">
                <div className="display-6 fw-bold text-primary">{points?.total ?? 0}</div>
                <p className="text-muted small mb-0">{t("Total points")}</p>
              </div>
            </div>

            <div className="fh-card">
              <div className="fh-card__head"><i className="fas fa-certificate"></i><h3>{t("Certificates")}</h3></div>
              <div className="fh-card__body">
                {certs.length === 0 ? (
                  <p className="text-muted mb-0">{t("No data")}</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {certs.map((c) => (
                      <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>#{c.id} — {new Date(c.dateOfIssue * 1000).toLocaleDateString(ar ? "ar-EG" : "en-US")}</span>
                        <CertificateButton certificateId={c.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="fh-card">
              <div className="fh-card__head"><i className="fas fa-user-pen"></i><h3>{t("Edit Profile")}</h3></div>
              <div className="fh-card__body">
                <form onSubmit={saveProfile}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="fh-label">{t("Name (Arabic)")}</label>
                      <input className="form-control" value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Name (English)")}</label>
                      <input className="form-control" value={form.nameEn ?? ""} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Mobile")}</label>
                      <input className="form-control" value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Gender")}</label>
                      <select className="form-select" value={form.gender ?? ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                        <option value="">{t("Select...")}</option>
                        <option value="Male">{t("Male")}</option>
                        <option value="Female">{t("Female")}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Date of Birth")}</label>
                      <input id="dob" type="date" className="form-control" defaultValue={toDateInput(form.dateOfBirth)} />
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Country")}</label>
                      <select className="form-select" value={form.countryId ?? ""} onChange={(e) => setForm({ ...form, countryId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">{t("Select...")}</option>
                        {countries.map((c) => (<option key={c.id} value={c.id}>{ar ? (c.arCountryName || c.enCountryName) : (c.enCountryName || c.arCountryName)}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Job")}</label>
                      <select className="form-select" value={form.jobCode ?? ""} onChange={(e) => setForm({ ...form, jobCode: e.target.value })}>
                        <option value="">{t("Select...")}</option>
                        {jobs.map((j) => (<option key={j.jobCode} value={j.jobCode}>{ar ? (j.jobTitleAr || j.jobTitleEn) : (j.jobTitleEn || j.jobTitleAr)}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="fh-label">{t("Preferred Language")}</label>
                      <select className="form-select" value={form.preferredCulture ?? ""} onChange={(e) => setForm({ ...form, preferredCulture: e.target.value })}>
                        <option value="">{t("Select...")}</option>
                        {CULTURES.map((c) => (<option key={c.code} value={c.code}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="btn btn-primary" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-save me-2" />}
                      {t("Save Changes")}
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
