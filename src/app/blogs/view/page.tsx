"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, fileUrl } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Blog {
  id: number;
  title: string;
  body: string;
  reads: number;
  coverImage?: string | null;
  images?: string[];
}

function BlogDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { t } = useI18n();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    api.get<Blog>(`/api/blogs/${id}`, false)
      .then((r) => setBlog(r.data ?? null))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (!blog) {
    return (
      <div className="fh-page">
        <header className="fh-page__header">
          <div className="fh-container">
            <span className="fh-page__icon"><i className="fas fa-newspaper" aria-hidden="true" /></span>
            <h1 className="fh-page__title">{t("No data")}</h1>
          </div>
        </header>
        <div className="fh-container">
          <Link href="/blogs" className="btn btn-primary">
            <i className="fas fa-arrow-right fhx-back-icon" aria-hidden="true" />
            {t("Back to Blog")}
          </Link>
        </div>
      </div>
    );
  }

  const cover = fileUrl(blog.coverImage);

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-newspaper" aria-hidden="true" /></span>
          <h1 className="fh-page__title">{blog.title}</h1>
          <p className="fh-page__subtitle">
            <i className="fas fa-eye" aria-hidden="true" />
            {" "}{blog.reads} {t("Reads")}
          </p>
        </div>
      </header>

      <div className="fh-container">
        <article className="fhx-article">
          {cover ? (
            <div className="fhx-article__cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={blog.title} />
            </div>
          ) : null}

          <div className="fh-card">
            <div className="fh-card__body fhx-article__body">
              <div className="fhx-article__content" dangerouslySetInnerHTML={{ __html: blog.body }} />

              {blog.images && blog.images.length > 0 && (
                <div className="fhx-article__gallery">
                  {blog.images.map((src, i) => {
                    const thumb = fileUrl(src);
                    if (!thumb) return null;
                    return (
                      <button
                        type="button"
                        key={`${src}-${i}`}
                        className="fhx-book-detail__thumb"
                        onClick={() => window.open(thumb, "_blank")}
                        aria-label={t("View Details")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" loading="lazy" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="fhx-article__foot">
                <Link href="/blogs" className="btn btn-outline-primary">
                  <i className="fas fa-arrow-right fhx-back-icon" aria-hidden="true" />
                  {t("Back to Blog")}
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  return (
    <Suspense fallback={<div className="fh-page" />}>
      <BlogDetail />
    </Suspense>
  );
}
