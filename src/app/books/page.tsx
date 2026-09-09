"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: number;
  title: string;
  author?: string | null;
  publisher?: string | null;
  year?: number | null;
  visits: number;
  downloads: number;
  coverUrl?: string | null;
  coverKey?: string | null;
}

export default function BooksPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Book[]>("/api/books", false)
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function download(id: number) {
    try {
      const r = await api.post<{ url?: string }>(`/api/books/${id}/download`, {}, false);
      if (r.data?.url) window.open(r.data.url, "_blank");
    } catch {
      /* تجاهل */
    }
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "مكتبة الفاتحة" : "Fatiha Library"}</h2>

      {loading ? (
        <p className="text-muted">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-book fa-3x mb-3"></i>
          <p>{ar ? "لا توجد كتب متاحة حالياً." : "No books available at the moment."}</p>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((b) => (
            <div className="col-12 col-sm-6 col-lg-3" key={b.id}>
              <div className="card h-100 shadow-sm border-0 rounded-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.coverUrl || "/hero-img.jpg"}
                  alt={b.title}
                  className="card-img-top rounded-top-4"
                  style={{ height: 240, objectFit: "cover" }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold text-truncate">{b.title}</h5>
                  <p className="card-text text-muted small mb-3">
                    {b.publisher || b.author || ""} {b.year ? `(${b.year})` : ""}
                  </p>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="small text-muted">
                      <i className="fas fa-eye me-1"></i>
                      {b.visits} · <i className="fas fa-download me-1"></i>
                      {b.downloads}
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => download(b.id)}>
                      {ar ? "عرض التفاصيل" : "View Details"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
