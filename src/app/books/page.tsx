"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fileUrl } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: number;
  title: string;
  author?: string | null;
  publisher?: string | null;
  year?: number | null;
  visits: number;
  downloads: number;
  cover?: string | null;
  images?: string[];
}

/** مكتبة الفاتحة — بنفس هوية الموقع (عاجي/زمردي/ذهبي). */
export default function BooksPage() {
  const { t } = useI18n();
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
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-book-open-reader" aria-hidden="true" /></span>
          <h1 className="fh-page__title">{t("Fatiha Library")}</h1>
          <p className="fh-page__subtitle">
            {t("Explore curated books and resources about Surah Al-Fatiha, its meanings, and the ten Qiraat.")}
          </p>
        </div>
      </header>

      <div className="fh-container">
        {loading ? (
          <div className="fh-empty">
            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
            <p className="mb-0">{t("Loading...")}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="fh-empty">
            <i className="fas fa-book" aria-hidden="true" />
            <p className="mb-0">{t("No books available at the moment.")}</p>
          </div>
        ) : (
          <div className="fhx-books">
            {items.map((b) => {
              const cover = fileUrl(b.cover) ?? "/hero-img.jpg";
              const meta = [b.author, b.publisher, b.year ? String(b.year) : ""].filter(Boolean).join(" · ");
              return (
                <article className="fhx-book" key={b.id}>
                  <Link href={`/books/view?id=${b.id}`} className="fhx-book__cover" aria-label={b.title}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={b.title} loading="lazy" />
                    <span className="fhx-book__spine" aria-hidden="true" />
                    <span className="fhx-book__badge">
                      <i className="fas fa-book" aria-hidden="true" />
                      {t("Book")}
                    </span>
                  </Link>

                  <div className="fhx-book__body">
                    <h2 className="fhx-book__title">{b.title}</h2>
                    {meta ? <p className="fhx-book__meta">{meta}</p> : null}

                    <div className="fhx-book__stats">
                      <span><i className="fas fa-eye" aria-hidden="true" />{b.visits}</span>
                      <span><i className="fas fa-download" aria-hidden="true" />{b.downloads}</span>
                    </div>

                    <div className="fhx-book__actions">
                      <Link href={`/books/view?id=${b.id}`} className="btn btn-primary btn-sm flex-grow-1">
                        <i className="fas fa-book-open" aria-hidden="true" />
                        {t("View Details")}
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => download(b.id)}
                        title={t("Download")}
                        aria-label={t("Download")}
                      >
                        <i className="fas fa-download" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
