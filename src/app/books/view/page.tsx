"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, fileUrl } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: number;
  title: string;
  author?: string | null;
  publisher?: string | null;
  year?: number | null;
  description?: string | null;
  cover?: string | null;
  fileUrl?: string | null;
  images?: string[];
  visits: number;
  downloads: number;
}

function BookDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { t } = useI18n();
  const [b, setB] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    api.get<Book>(`/api/books/${id}`, false)
      .then((r) => setB(r.data ?? null))
      .catch(() => setB(null))
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="fh-page">
        <div className="fh-container" style={{ paddingTop: 40 }}>
          <div className="fh-empty">
            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
            <p className="mb-0">{t("Loading...")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!b) {
    return (
      <div className="fh-page">
        <header className="fh-page__header">
          <div className="fh-container">
            <span className="fh-page__icon"><i className="fas fa-book-circle-question" aria-hidden="true" /></span>
            <h1 className="fh-page__title">{t("Book not found")}</h1>
          </div>
        </header>
        <div className="fh-container">
          <Link href="/books" className="btn btn-primary">
            <i className="fas fa-arrow-right fhx-back-icon" aria-hidden="true" />
            {t("Back to Library")}
          </Link>
        </div>
      </div>
    );
  }

  const cover = fileUrl(b.cover) ?? "/hero-img.jpg";
  const meta = [b.author, b.publisher, b.year ? String(b.year) : ""].filter(Boolean).join(" · ");

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-book-open" aria-hidden="true" /></span>
          <h1 className="fh-page__title">{b.title}</h1>
          {meta ? <p className="fh-page__subtitle">{meta}</p> : null}
        </div>
      </header>

      <div className="fh-container">
        <div className="fhx-book-detail">
          <div className="fhx-book-detail__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={b.title} />
            <span className="fhx-book__spine" aria-hidden="true" />
          </div>

          <div className="fh-card fhx-book-detail__panel">
            <div className="fh-card__body">
              <div className="fhx-book-detail__stats">
                <span><i className="fas fa-eye" aria-hidden="true" />{b.visits}</span>
                <span><i className="fas fa-download" aria-hidden="true" />{b.downloads}</span>
                <span><i className="fas fa-book" aria-hidden="true" />{t("Book")}</span>
              </div>

              {b.images && b.images.length > 0 && (
                <div className="fhx-book-detail__gallery">
                  {b.images.map((src, i) => {
                    const thumb = fileUrl(src);
                    if (!thumb) return null;
                    return (
                      <button
                        type="button"
                        key={`${src}-${i}`}
                        onClick={() => window.open(thumb, "_blank")}
                        className="fhx-book-detail__thumb"
                        aria-label={t("View Details")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" loading="lazy" />
                      </button>
                    );
                  })}
                </div>
              )}

              {b.description ? (
                <p className="fhx-book-detail__desc">{b.description}</p>
              ) : null}

              <div className="fhx-book-detail__actions">
                <button type="button" className="btn btn-primary" onClick={download}>
                  <i className="fas fa-download" aria-hidden="true" />
                  {t("Download / View")}
                </button>
                <Link href="/books" className="btn btn-outline-primary">
                  <i className="fas fa-arrow-right fhx-back-icon" aria-hidden="true" />
                  {t("Back to Library")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookDetailsPage() {
  return (
    <Suspense fallback={<div className="fh-page" />}>
      <BookDetail />
    </Suspense>
  );
}
