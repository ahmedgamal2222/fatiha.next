"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: number;
  title: string;
  author?: string | null;
  publisher?: string | null;
  year?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  fileUrl?: string | null;
  visits: number;
  downloads: number;
}

export default function BookDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useI18n();
  const [b, setB] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<Book>(`/api/books/${id}`, false).then((r) => setB(r.data ?? null)).catch(() => setB(null)).finally(() => setLoading(false));
  }, [id]);

  async function download() {
    if (!b) return;
    try {
      const r = await api.post<{ url?: string }>(`/api/books/${b.id}/download`, {}, false);
      if (r.data?.url) window.open(r.data.url, "_blank");
    } catch {
      /* تجاهل */
    }
  }

  if (loading) return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;
  if (!b) return <div className="container py-5 min-vh-100">{t("Book not found")}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="row g-4">
        <div className="col-lg-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.coverUrl || "/hero-img.jpg"} alt={b.title} className="img-fluid rounded-4 shadow-sm w-100" style={{ objectFit: "cover" }} />
        </div>
        <div className="col-lg-8">
          <h1 className="fw-bold text-primary">{b.title}</h1>
          <p className="text-muted mb-2">
            {b.author} {b.publisher ? `· ${b.publisher}` : ""} {b.year ? `(${b.year})` : ""}
          </p>
          <p className="small text-muted">
            <i className="fas fa-eye me-1"></i>{b.visits} · <i className="fas fa-download me-1"></i>{b.downloads}
          </p>
          {b.description && <p style={{ whiteSpace: "pre-wrap" }}>{b.description}</p>}
          <button className="btn btn-primary mt-3" onClick={download}>
            <i className="fas fa-download me-2"></i>
            {t("Download / View")}
          </button>
        </div>
      </div>
    </div>
  );
}
