"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { useI18n } from "@/context/I18nContext";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const { t } = useI18n();
  const [seedMsg, setSeedMsg] = useState("");
  const [seeding, setSeeding] = useState(false);

  async function seedReference() {
    setSeeding(true); setSeedMsg("");
    try {
      const res = await api.post<{ countriesAdded: number; jobsAdded: number }>("/api/reference/seed", {});
      if (res.success) {
        const d = res.data;
        setSeedMsg(t("Reference data ready. Countries: {c}, Jobs: {j}")
          .replace("{c}", String(d?.countriesAdded ?? 0)).replace("{j}", String(d?.jobsAdded ?? 0)));
      } else { setSeedMsg(res.message || t("Operation failed")); }
    } catch { setSeedMsg(t("Operation failed")); }
    finally { setSeeding(false); }
  }

  const cards = [
    { href: "/admin/fatiha-requests", icon: "fa-clipboard-check", title: "Manage Fatiha Requests", desc: "Review, approve and issue certificates" },
    { href: "/admin/authorized-users", icon: "fa-user-graduate", title: "Ijazah Applications", desc: "Authorize certified instructors" },
    { href: "/admin/al-qerat", icon: "fa-book-quran", title: "Manage Recitations", desc: "Add and edit Quran recitations" },
    { href: "/admin/fatiha-exam", icon: "fa-circle-question", title: "Manage Exam Questions", desc: "Question bank & AI generation" },
    { href: "/admin/users", icon: "fa-users", title: "Manage Users", desc: "Roles and accounts" },
    { href: "/admin/blogs", icon: "fa-blog", title: "Manage Blog", desc: "Articles and categories" },
    { href: "/admin/books", icon: "fa-book", title: "Manage Library", desc: "Books and resources" },
    { href: "/admin/marketplace", icon: "fa-store", title: "Manage Marketplace", desc: "Products and listings" },
    { href: "/admin/pages", icon: "fa-file-alt", title: "Static Pages", desc: "Site content pages" },
    { href: "/admin/newsletter", icon: "fa-envelope", title: "Newsletter", desc: "Subscribers and campaigns" },
  ];

  return (
    <AdminGuard>
      <div className="fh-page">
        <header className="fh-page__header">
          <div className="fh-container">
            <span className="fh-page__icon"><i className="fas fa-gauge-high"></i></span>
            <h1 className="fh-page__title">{t("Admin Panel")}</h1>
            <p className="fh-page__subtitle">{t("Manage requests, instructors, content and users from one place.")}</p>
          </div>
        </header>
        <div className="fh-container">
          <div className="row g-4">
            {cards.map((c) => (
              <div className="col-12 col-sm-6 col-lg-4" key={c.href}>
                <Link href={c.href} className="text-decoration-none">
                  <div className="fh-admin-card">
                    <span className="fh-admin-card__icon"><i className={`fas ${c.icon}`}></i></span>
                    <div>
                      <h5 className="fh-admin-card__title">{t(c.title)}</h5>
                      <p className="fh-admin-card__desc">{t(c.desc)}</p>
                    </div>
                    <i className="fas fa-arrow-right fh-admin-card__arrow"></i>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="fh-card mt-4">
            <div className="fh-card__head"><i className="fas fa-database"></i><h3>{t("Setup")}</h3></div>
            <div className="fh-card__body d-flex flex-wrap align-items-center gap-3">
              <div className="flex-grow-1">
                <strong>{t("Initialize reference data")}</strong>
                <p className="text-muted small mb-0">{t("Populate the countries and jobs lists used in profiles (run once).")}</p>
              </div>
              <button className="btn btn-outline-primary" onClick={seedReference} disabled={seeding}>
                {seeding ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-database me-2" />}
                {t("Initialize")}
              </button>
            </div>
            {seedMsg && <div className="px-4 pb-3"><div className="alert alert-info rounded-4 mb-0 py-2">{seedMsg}</div></div>}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
