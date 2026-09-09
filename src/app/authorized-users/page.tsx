"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface AuthorizedUser {
  id: number;
  briefOverview?: string | null;
  profileImg?: string | null;
  points: number;
  isAvailable: boolean;
  alQeratId: number;
}

export default function AuthorizedUsersPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AuthorizedUser[]>("/api/authorized-users", false).then((r) => setItems(r.data ?? [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">{ar ? "المُجازون" : "Certified Instructors"}</h2>
        <Link href="/authorized-users/apply" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          {ar ? "تقديم طلب" : "Apply"}
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : items.length === 0 ? (
        <p className="text-muted">{ar ? "لا توجد بيانات" : "No data"}</p>
      ) : (
        <div className="row g-4">
          {items.map((u) => (
            <div className="col-12 col-sm-6 col-lg-4" key={u.id}>
              <Link href={`/authorized-users/${u.id}`} className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 rounded-4">
                  <div className="card-body text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.profileImg || "https://placehold.co/96x96?text=?"}
                      alt=""
                      width={96}
                      height={96}
                      className="rounded-circle border mb-3"
                      style={{ objectFit: "cover" }}
                    />
                    <p className="text-muted small mb-2">{u.briefOverview?.slice(0, 90) || ""}</p>
                    <div className="d-flex justify-content-center gap-2">
                      <span className="badge bg-primary-subtle text-primary">{u.points} {ar ? "نقطة" : "pts"}</span>
                      <span className={`badge ${u.isAvailable ? "bg-success" : "bg-secondary"}`}>
                        {u.isAvailable ? (ar ? "متاح" : "Available") : ar ? "غير متاح" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
