"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Cert {
  id: number;
  applicationUserId: string;
  fatihaRequestId: number;
  dateOfIssue: number | string;
  authorizedByNameAr?: string | null;
  authorizedByNameEn?: string | null;
  applicantNameAr?: string | null;
  applicantNameEn?: string | null;
  applicantEmail?: string | null;
  pdfUrl?: string | null;
}

function parseDate(v?: number | string | null): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function CertificatesInner() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [rows, setRows] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Cert[]>("/api/certificates")
      .then((r) => setRows(r.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /** يفتح نافذة اختيار الملف لحفظ الشهادة المرفوعة على R2. */
  function pickFile(id: number) {
    setTargetId(id);
    setMsg(""); setErr("");
    fileInput.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || targetId === null) return;
    setBusyId(targetId); setMsg(""); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.upload(`/api/certificates/${targetId}/file`, fd);
      setMsg(t("File uploaded"));
      load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Upload failed"));
    } finally {
      setBusyId(null);
      setTargetId(null);
    }
  }

  async function removeFile(id: number) {
    if (!confirm(t("Remove file"))) return;
    setBusyId(id); setMsg(""); setErr("");
    try {
      await api.del(`/api/certificates/${id}/file`);
      setMsg(t("Deleted"));
      load();
    } catch {
      setErr(t("Operation failed"));
    } finally { setBusyId(null); }
  }


  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-certificate"></i></span>
          <h1 className="fh-page__title">{t("Certificates")}</h1>
          <p className="fh-page__subtitle">{t("Upload and manage issued certificates")}</p>
        </div>
      </header>

      <div className="fh-container" style={{ maxWidth: 1000 }}>
        <input ref={fileInput} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />

        {msg && <div className="alert alert-success rounded-4">{msg}</div>}
        {err && <div className="alert alert-danger rounded-4">{err}</div>}

        {loading ? (
          <div className="fh-card"><div className="fh-card__body text-center py-5"><span className="spinner-border text-primary mb-3" /><div className="text-muted">{t("Loading...")}</div></div></div>
        ) : rows.length === 0 ? (
          <div className="fh-empty"><i className="fas fa-certificate" /><p>{t("No data")}</p></div>
        ) : (
          <div className="fh-card">
            <div className="fh-card__body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("Certificate No.")}</th>
                      <th>{t("Applicant")}</th>
                      <th>{t("Instructor")}</th>
                      <th>{t("Date of Issue")}</th>
                      <th className="text-end">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => {
                      const issued = parseDate(c.dateOfIssue);
                      const name = ar
                        ? c.applicantNameAr || c.applicantNameEn || c.applicantEmail || "\u2014"
                        : c.applicantNameEn || c.applicantNameAr || c.applicantEmail || "\u2014";
                      const sheikh = ar
                        ? c.authorizedByNameAr || c.authorizedByNameEn || "\u2014"
                        : c.authorizedByNameEn || c.authorizedByNameAr || "\u2014";
                      return (
                        <tr key={c.id}>
                          <td className="fw-bold text-primary">#{c.id}</td>
                          <td>
                            <div className="fw-semibold">{name}</div>
                            <div className="small text-muted" dir="ltr">{c.applicantEmail ?? ""}</div>
                          </td>
                          <td className="small">{sheikh}</td>
                          <td className="small">{issued ? issued.toLocaleDateString(ar ? "ar-EG" : "en-GB") : "\u2014"}</td>
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end flex-wrap">
                              {c.pdfUrl ? (
                                <>
                                  <a className="btn btn-sm btn-outline-primary" href={c.pdfUrl} target="_blank" rel="noreferrer">
                                    <i className="fas fa-eye me-1" />
                                    {t("View file")}
                                  </a>
                                  <button className="btn btn-sm btn-outline-secondary" disabled={busyId === c.id} onClick={() => pickFile(c.id)}>
                                    <i className="fas fa-upload me-1" />
                                    {t("Replace file")}
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" disabled={busyId === c.id} onClick={() => removeFile(c.id)}>
                                    <i className="fas fa-trash" />
                                  </button>
                                </>
                              ) : (
                                <button className="btn btn-sm btn-primary" disabled={busyId === c.id} onClick={() => pickFile(c.id)}>
                                  {busyId === c.id ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-upload me-1" />}
                                  {t("Upload certificate file")}
                                </button>
                              )}
                              <a className="btn btn-sm btn-outline-secondary" href={`/verify?id=${c.id}`} target="_blank" rel="noreferrer">
                                <i className="fas fa-qrcode" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCertificatesPage() {
  return (
    <AdminGuard>
      <CertificatesInner />
    </AdminGuard>
  );
}
