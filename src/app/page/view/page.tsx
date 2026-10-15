"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { parsePageDoc } from "@/lib/blocks";

interface StaticPage {
  id: number;
  title?: string | null;
  slug?: string | null;
  content?: string | null;
  html?: string | null;
  blocks?: string | null;
}

function PageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const { t } = useI18n();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id && !slug) {
      setLoading(false);
      return;
    }
    // يُفضّل الرابط الودّي (slug) ثم المعرّف (id)
    const path = slug ? `/api/pages/slug/${encodeURIComponent(slug)}` : `/api/pages/${id}`;
    api
      .get<StaticPage>(path, false)
      .then((r) => setPage(r.data ?? null))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [id, slug]);

  if (loading) return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;
  if (!page) return <div className="container py-5 min-vh-100">{t("Page not found")}</div>;

  // صفحة باني الصفحات (Blocks) — تُرسم بأنماط الثيم المدمجة
  const doc = parsePageDoc(page.blocks);
  if (doc.blocks.length > 0) {
    return (
      <div style={{ background: doc.theme.bg, minHeight: "60vh" }}>
        <BlockRenderer doc={doc} />
      </div>
    );
  }

  // الاحتياط: صفحات قديمة مخزّنة كـ HTML/نص
  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="mx-auto" style={{ maxWidth: 860 }}>
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4 p-md-5">
            {page.title && <h1 className="fw-bold text-primary mb-4">{page.title}</h1>}
            <div dangerouslySetInnerHTML={{ __html: page.html || page.content || "" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PageViewer() {
  return (
    <Suspense fallback={<div className="container py-5 min-vh-100" />}>
      <PageContent />
    </Suspense>
  );
}

