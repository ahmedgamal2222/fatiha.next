"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
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
    api
      .get<Blog>(`/api/blogs/${id}`, false)
      .then((r) => setBlog(r.data ?? null))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;
  if (!blog) return <div className="container py-5 min-vh-100">{t("No data")}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="mx-auto" style={{ maxWidth: 760 }}>
        <article className="card shadow-sm border-0 rounded-4">
          {blog.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={blog.coverImage} alt={blog.title} className="card-img-top rounded-top-4" style={{ maxHeight: 380, objectFit: "cover" }} />
          ) : null}
          <div className="card-body p-4 p-md-5">
            <h1 className="fw-bold text-primary">{blog.title}</h1>
            <p className="text-muted small">
              <i className="fas fa-eye me-1"></i>
              {blog.reads} {t("Reads")}
            </p>
            <hr />
            <div dangerouslySetInnerHTML={{ __html: blog.body }} />
            {blog.images && blog.images.length > 0 && (
              <div className="row g-3 mt-4">
                {blog.images.map((src, i) => (
                  <div className="col-6 col-md-4" key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="w-100 rounded-3 border"
                      style={{ height: 150, objectFit: "cover", cursor: "pointer" }}
                      onClick={() => window.open(src, "_blank")}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  return (
    <Suspense fallback={<div className="container py-5 min-vh-100" />}>
      <BlogDetail />
    </Suspense>
  );
}
