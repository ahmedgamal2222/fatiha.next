"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

/**
 * صفحة التحقق العام من الشهادة — تُفتح من رمز QR المطبوع على الشهادة.
 * المسار: /verify?id=123  (تصدير ساكن => لا مسارات ديناميكية [id])
 * ويُدعَم أيضاً شكل /verify/123 عبر public/_redirects على Cloudflare Pages.
 * تقرأ من: GET /api/certificates/verify/:id (بلا مصادقة)
 */

interface VerifyData {
  certificateId: number;
  applicant: { arabic: string; english: string };
  sheikhName: { arabic: string; english: string };
  readingMethod: string;
  dateOfIssue: number | string;
  alQeratId: number;
}

/** يحلّل التاريخ من رقم (ثوانٍ/ملّي) أو سلسلة ISO بشكل آمن. */
function parseDate(v?: number | string | null): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** يستخرج رقم الشهادة من مسار على شكل /verify/123 (احتياطي). */
function idFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/\/verify\/(\d+)/i);
  return m ? m[1] : null;
}

function VerifyContent() {
  const search = useSearchParams();
  const { t, lang } = useI18n();
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<VerifyData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "invalid" | "missing" | "error">("loading");

  useEffect(() => {
    const q = search.get("id");
    const value = q ?? idFromLocation();
    if (!value) {
      // لا رقم في الرابط ⇒ لا داعي لعرض دوّارة التحميل إلى الأبد
      setStatus("invalid");
      return;
    }
    setId(value);
  }, [search]);

  useEffect(() => {
    if (id === null) return;
    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    api
      .get<VerifyData>(`/api/certificates/verify/${id}`, false)
      .then((r) => {
        setData(r.data ?? null);
        setStatus(r.data ? "ok" : "missing");
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 400) setStatus("invalid");
        else if (e instanceof ApiError && e.status === 404) setStatus("missing");
        else setStatus("error");
      });
  }, [id]);

  const ar = lang === "ar";
  const pick = (v: { arabic: string; english: string } | undefined) =>
    ar ? v?.arabic || v?.english : v?.english || v?.arabic;

  const issued = parseDate(data?.dateOfIssue);
  const dateStr = issued
    ? issued.toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    padding: "12px 0",
    borderBottom: "1px solid rgba(15, 118, 110, 0.12)",
  };

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon">
            <i className="fas fa-certificate"></i>
          </span>
          <h1 className="fh-page__title">{t("Verify Certificate")}</h1>
          <p className="fh-page__subtitle">
            {t("Scan the QR code printed on the certificate or open its link to verify its authenticity.")}
          </p>
        </div>
      </header>

      <div className="fh-container" style={{ maxWidth: 760 }}>
        {status === "loading" && (
          <div className="fh-card">
            <div className="fh-card__body text-center py-5">
              <span className="spinner-border text-primary mb-3" role="status" />
              <div className="text-muted">{t("Loading...")}</div>
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div className="alert alert-danger rounded-4">
            <i className="fas fa-circle-exclamation me-2" />
            {t("Invalid certificate number")}
          </div>
        )}

        {status === "missing" && (
          <div className="fh-card">
            <div className="fh-card__body text-center py-5">
              <i className="fas fa-circle-xmark fa-3x text-danger mb-3" />
              <h3 className="fw-bold mb-0">{t("Certificate not found")}</h3>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="alert alert-danger rounded-4">
            <i className="fas fa-triangle-exclamation me-2" />
            {t("Server error")}
          </div>
        )}

        {status === "ok" && data && (
          <div className="fh-card">
            <div className="fh-card__head">
              <i className="fas fa-shield-halved"></i>
              <h3>{t("Certificate verified")}</h3>
            </div>
            <div className="fh-card__body">
              <div
                className="d-flex align-items-center gap-3 mb-4 p-3 rounded-4"
                style={{ background: "rgba(22, 163, 74, 0.08)" }}
              >
                <i className="fas fa-circle-check fa-2x" style={{ color: "#15803d" }} />
                <div>
                  <div className="fw-bold" style={{ color: "#15803d" }}>
                    {t("Certificate verified")}
                  </div>
                  <div className="small text-muted">
                    {t("This certificate is authentic and issued by the Fatiha platform.")}
                  </div>
                </div>
              </div>

              <div style={rowStyle}>
                <span className="fh-label mb-0">{t("Applicant")}</span>
                <span className="fw-semibold">{pick(data.applicant) || t("Unknown")}</span>
              </div>
              <div style={rowStyle}>
                <span className="fh-label mb-0">{t("Instructor")}</span>
                <span className="fw-semibold">{pick(data.sheikhName) || "\u2014"}</span>
              </div>
              <div style={rowStyle}>
                <span className="fh-label mb-0">{t("Reading Method")}</span>
                <span className="fw-semibold">{data.readingMethod || "\u2014"}</span>
              </div>
              <div style={rowStyle}>
                <span className="fh-label mb-0">{t("Date of Issue")}</span>
                <span className="fw-semibold">{dateStr}</span>
              </div>
              <div style={{ ...rowStyle, borderBottom: "none" }}>
                <span className="fh-label mb-0">{t("Certificate No.")}</span>
                <span className="fw-bold text-primary">#{data.certificateId}</span>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link className="btn btn-outline-primary btn-sm" href="/">
                  <i className="fas fa-house me-1" />
                  {t("Home")}
                </Link>
                <Link className="btn btn-primary btn-sm" href="/profile">
                  <i className="fas fa-certificate me-1" />
                  {t("View Certificates")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="container py-5 min-vh-100" />}>
      <VerifyContent />
    </Suspense>
  );
}
