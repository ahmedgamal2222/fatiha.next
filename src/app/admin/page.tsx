"use client";

import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";
import { useI18n } from "@/context/I18nContext";

export default function AdminDashboard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const cards = [
    { href: "/admin/users", icon: "fa-users", ar: "إدارة المستخدمين", en: "Manage Users" },
    { href: "/admin/blogs", icon: "fa-blog", ar: "إدارة المدوّنة", en: "Manage Blog" },
    { href: "/admin/books", icon: "fa-book", ar: "إدارة المكتبة", en: "Manage Library" },
    { href: "/admin/marketplace", icon: "fa-store", ar: "إدارة المتجر", en: "Manage Marketplace" },
    { href: "/admin/pages", icon: "fa-file-alt", ar: "الصفحات الثابتة", en: "Static Pages" },
    { href: "/admin/newsletter", icon: "fa-envelope", ar: "النشرة البريدية", en: "Newsletter" },
  ];

  return (
    <AdminGuard>
      <div className="container py-5 min-vh-100 bg-light">
        <h2 className="fw-bold text-primary mb-4">{ar ? "لوحة التحكم" : "Admin Panel"}</h2>
        <div className="row g-4">
          {cards.map((c) => (
            <div className="col-12 col-sm-6 col-lg-4" key={c.href}>
              <Link href={c.href} className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 rounded-4 text-center py-4">
                  <div className="card-body">
                    <i className={`fas ${c.icon} fa-2x text-primary mb-3`}></i>
                    <h5 className="fw-bold text-dark mb-0">{ar ? c.ar : c.en}</h5>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AdminGuard>
  );
}
