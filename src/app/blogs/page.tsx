"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, fileUrl } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Blog {
  id: number;
  title: string;
  body: string;
  reads: number;
  category?: string | null;
  blogCategoryId?: number;
  coverImage?: string | null;
}

const PAGE_SIZE = 9;

/** مدونة الفاتحة — بطاقات «مخطوطة» بهوية الموقع. */
export default function BlogsPage() {
  const { t } = useI18n();
  const [all, setAll] = useState<Blog[]>([]);
  const [cats, setCats] = useState<Record<number, string>>({});
  const [searchTerm, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [currentPage, setPage] = useState(1);

  useEffect(() => {
    api.get<Blog[]>("/api/blogs", false)
      .then((r) => setAll(r.data ?? []))
      .catch(() => setAll([]));
    api.get<Array<{ id: number; name: string }>>("/api/blogs/categories", false)
      .then((r) => {
        const map: Record<number, string> = {};
        (r.data ?? []).forEach((c) => { map[c.id] = c.name; });
        setCats(map);
      })
      .catch(() => setCats({}));
  }, []);

  const filtered = useMemo(
    () => all.filter((b) => !applied || b.title.toLowerCase().includes(applied.toLowerCase())),
    [all, applied]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function stripHtml(html: string, n: number) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
  }

  function applySearch() {
    setApplied(searchTerm);
    setPage(1);
  }

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-newspaper" aria-hidden="true" /></span>
          <h1 className="fh-page__title">{t("Fatiha Blog")}</h1>
          <p className="fh-page__subtitle">
            {t("Insights and reflections on Surah Al-Fatiha, its meanings, and the Quranic sciences.")}
          </p>
        </div>
      </header>

      <div className="fh-container">
        <div className="fhx-toolbar">
          <div className="fhx-toolbar__field">
            <i className="fas fa-magnifying-glass" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={(e) => { if (e.key === "Enter") applySearch(); }}
              placeholder={t("Search Blogs")}
              aria-label={t("Search Blogs")}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={applySearch}>
            <i className="fas fa-search" aria-hidden="true" />
            {t("Search")}
          </button>
        </div>

        {pageItems.length === 0 ? (
          <div className="fh-empty">
            <i className="fas fa-newspaper" aria-hidden="true" />
            <p className="mb-0">{t("No data")}</p>
          </div>
        ) : (
          <div className="fhx-posts">
            {pageItems.map((blog) => {
              const cover = fileUrl(blog.coverImage);
              return (
                <article className="fhx-post" key={blog.id}>
                  <Link href={`/blogs/view?id=${blog.id}`} className="fhx-post__media" aria-label={blog.title}>
                    {cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={cover} alt={blog.title} loading="lazy" />
                    ) : (
                      <span className="fhx-post__ph"><i className="fas fa-newspaper" aria-hidden="true" /></span>
                    )}
                    <span className="fhx-post__badge">
                      {blog.category || (blog.blogCategoryId ? cats[blog.blogCategoryId] : "") || t("Uncategorized")}
                    </span>
                  </Link>

                  <div className="fhx-post__body">
                    <h2 className="fhx-post__title">
                      <Link href={`/blogs/view?id=${blog.id}`}>{blog.title}</Link>
                    </h2>
                    <p className="fhx-post__excerpt">{stripHtml(blog.body, 150)}…</p>
                    <div className="fhx-post__foot">
                      <span className="fhx-post__reads">
                        <i className="fas fa-eye" aria-hidden="true" />
                        {blog.reads} {t("Reads")}
                      </span>
                      <Link href={`/blogs/view?id=${blog.id}`} className="fhx-post__more">
                        {t("Read More")}
                        <i className="fas fa-arrow-left fhx-more-icon" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="fhx-pager">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setPage(page)}
                className={`fhx-pager__btn${currentPage === page ? " is-active" : ""}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
