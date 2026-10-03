"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Blog {
  id: number;
  title: string;
  body: string;
  reads: number;
  category?: string | null;
}

const PAGE_SIZE = 9;

export default function BlogsPage() {
  const { t } = useI18n();
  const [all, setAll] = useState<Blog[]>([]);
  const [searchTerm, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [currentPage, setPage] = useState(1);

  useEffect(() => {
    api.get<Blog[]>("/api/blogs", false).then((r) => setAll(r.data ?? [])).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(
    () => all.filter((b) => !applied || b.title.toLowerCase().includes(applied.toLowerCase())),
    [all, applied]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function stripHtml(html: string, n: number) {
    return html.replace(/<[^>]+>/g, "").slice(0, n);
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              setApplied(searchTerm);
              setPage(1);
            }
          }}
          placeholder={t("Search Blogs")}
          className="form-control form-control-lg shadow-sm"
        />
      </div>

      <div className="row g-4">
        {pageItems.map((blog) => (
          <div className="col-12 col-sm-6 col-lg-4" key={blog.id}>
            <div className="card h-100 shadow-sm border-0 rounded-4 hover-shadow position-relative">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-truncate mb-3 fw-bold text-primary">{blog.title}</h5>
                <p className="card-text text-muted small mb-4">{stripHtml(blog.body, 150)}...</p>
                <div className="mt-auto d-flex justify-content-between align-items-center small text-muted">
                  <span className="badge bg-primary-subtle text-primary">{blog.category || (t("Uncategorized"))}</span>
                  <span>
                    {blog.reads} {t("Reads")}
                  </span>
                </div>
                <Link href={`/blogs/view?id=${blog.id}`} className="stretched-link text-decoration-none mt-3 text-primary fw-semibold small">
                  {t("Read More")} →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 d-flex flex-wrap justify-content-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setPage(page)}
              type="button"
              className={`btn btn-outline-primary rounded-circle ${currentPage === page ? "active btn-primary text-white" : "bg-white"}`}
              style={{ width: 45, height: 45 }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
