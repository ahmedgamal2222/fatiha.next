"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Blog {
  id: number;
  title: string;
  body: string;
  reads: number;
}

export default function BlogDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useI18n();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
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
          <div className="card-body p-4 p-md-5">
            <h1 className="fw-bold text-primary">{blog.title}</h1>
            <p className="text-muted small">
              <i className="fas fa-eye me-1"></i>
              {blog.reads} {t("Reads")}
            </p>
            <hr />
            <div dangerouslySetInnerHTML={{ __html: blog.body }} />
          </div>
        </article>
      </div>
    </div>
  );
}
