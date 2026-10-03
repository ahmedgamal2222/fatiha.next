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

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get<PointsData>("/api/account/points").then((r) => setPoints(r.data ?? null)).catch(() => {});
    api.get<Certificate[]>("/api/account/certificates").then((r) => setCerts(r.data ?? [])).catch(() => {});
  }, [user]);

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      await api.upload("/api/account/profile/image", form);
      setMsg(t("Image updated"));
      await refresh();
    } catch {
      setMsg(t("Upload failed"));
    }
  }

  if (loading || !user) return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Profile")}</h2>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.profileImageUrl || "https://placehold.co/96x96?text=?"}
                  alt=""
                  width={96}
                  height={96}
                  className="rounded-circle border"
                  style={{ objectFit: "cover" }}
                />
                <div>
                  <h5 className="fw-bold mb-1">{user.nameAr || user.nameEn || user.email}</h5>
                  <p className="text-muted mb-1 small">{user.email}</p>
                  <span className="badge bg-primary-subtle text-primary">{user.role}</span>
                </div>
              </div>
              <hr />
              <label className="form-label fw-semibold small">{t("Change image")}</label>
              <input type="file" accept="image/*" onChange={onImage} className="form-control" />
              <div className="mt-3">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>{t("Completion")}</span>
                  <span>{user.profileCompletionPercentage ?? 0}%</span>
                </div>
                <div className="progress" style={{ height: 8 }}>
                  <div className="progress-bar bg-primary" style={{ width: `${user.profileCompletionPercentage ?? 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body">
              <h5 className="fw-bold">{t("Points")}</h5>
              <div className="display-6 fw-bold text-primary">{points?.total ?? 0}</div>
              <p className="text-muted small mb-0">{t("Total points")}</p>
            </div>
          </div>
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold">{t("Certificates")}</h5>
              {certs.length === 0 ? (
                <p className="text-muted mb-0">{t("No data")}</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {certs.map((c) => (
                    <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      <span>
                        #{c.id} — {new Date(c.dateOfIssue * 1000).toLocaleDateString()}
                      </span>
                      <CertificateButton certificateId={c.id} />
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
