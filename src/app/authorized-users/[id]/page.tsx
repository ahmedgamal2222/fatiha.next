"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Detail {
  id: number;
  briefOverview?: string | null;
  academicQualifications?: string | null;
  academicAttainment?: number | null;
  currentPosition?: number | null;
  profileImg?: string | null;
  cv?: string | null;
  points: number;
  isAvailable: boolean;
  facebook?: string | null;
  twitter?: string | null;
  linkedIn?: string | null;
  website?: string | null;
}

const ATTAINMENTS = ["Bachelor", "Master", "PostDoctorate", "HighSchool", "None", "Other"];
const POSITIONS = ["Student", "EntryLevel", "Junior", "Intermediate", "Senior", "Managerial", "Executive", "Other"];

export default function AuthorizedUserDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useI18n();
  const [u, setU] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<Detail>(`/api/authorized-users/${id}`, false).then((r) => setU(r.data ?? null)).catch(() => setU(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;
  if (!u) return <div className="container py-5 min-vh-100">{t("Not found")}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.profileImg || "https://placehold.co/120x120?text=?"} alt="" width={120} height={120} className="rounded-circle border mb-3" style={{ objectFit: "cover" }} />
            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className="badge bg-primary-subtle text-primary">{u.points} {t("pts")}</span>
              <span className={`badge ${u.isAvailable ? "bg-success" : "bg-secondary"}`}>
                {u.isAvailable ? (t("Available")) : t("Unavailable")}
              </span>
            </div>
            {u.briefOverview && <p className="text-muted">{u.briefOverview}</p>}
            {u.academicQualifications && (
              <p className="small text-muted"><strong>{t("Qualifications: ")}</strong>{u.academicQualifications}</p>
            )}
            <div className="d-flex justify-content-center gap-2 flex-wrap mb-2">
              {typeof u.academicAttainment === "number" && u.academicAttainment >= 0 && (
                <span className="badge bg-light text-dark border">{ATTAINMENTS[u.academicAttainment] ? t(ATTAINMENTS[u.academicAttainment]) : "-"}</span>
              )}
              {typeof u.currentPosition === "number" && u.currentPosition >= 0 && (
                <span className="badge bg-light text-dark border">{POSITIONS[u.currentPosition] ? t(POSITIONS[u.currentPosition]) : "-"}</span>
              )}
            </div>
            <div className="d-flex justify-content-center gap-3 fs-5 mt-3">
              {u.facebook && <a href={u.facebook} target="_blank" rel="noreferrer"><i className="fab fa-facebook"></i></a>}
              {u.twitter && <a href={u.twitter} target="_blank" rel="noreferrer"><i className="fab fa-x-twitter"></i></a>}
              {u.linkedIn && <a href={u.linkedIn} target="_blank" rel="noreferrer"><i className="fab fa-linkedin"></i></a>}
              {u.website && <a href={u.website} target="_blank" rel="noreferrer"><i className="fas fa-globe"></i></a>}
            </div>
            {u.cv && (
              <a href={u.cv} target="_blank" rel="noreferrer" className="btn btn-outline-primary mt-4">
                <i className="fas fa-file-pdf me-2"></i>{t("View CV")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
