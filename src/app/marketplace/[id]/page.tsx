"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Product {
  id: number;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  discountedPrice?: number | null;
  currencyCode?: string | null;
  buyUrl?: string | null;
  imageUrl?: string | null;
  images?: { url: string }[];
  tags?: { name: string }[];
}

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<Product>(`/api/marketplace/${id}`, false).then((r) => setP(r.data ?? null)).catch(() => setP(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container py-5 min-vh-100">{ar ? "جارٍ التحميل..." : "Loading..."}</div>;
  if (!p) return <div className="container py-5 min-vh-100">{ar ? "المنتج غير موجود" : "Product not found"}</div>;

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <div className="row g-4">
        <div className="col-lg-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images?.[0]?.url || p.imageUrl || "/cta.jpg"} alt={p.title} className="img-fluid rounded-4 shadow-sm w-100" style={{ objectFit: "cover", maxHeight: 420 }} />
          {p.images && p.images.length > 1 && (
            <div className="d-flex gap-2 mt-3 flex-wrap">
              {p.images.map((im, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={im.url} alt="" width={72} height={72} className="rounded-3 border" style={{ objectFit: "cover" }} />
              ))}
            </div>
          )}
        </div>
        <div className="col-lg-6">
          <h1 className="fw-bold text-primary">{p.title}</h1>
          <div className="fs-3 fw-bold mb-3">{p.price} {p.currencyCode || "USD"}</div>
          {p.tags && p.tags.length > 0 && (
            <div className="mb-3 d-flex gap-2 flex-wrap">
              {p.tags.map((t, i) => (
                <span key={i} className="badge bg-primary-subtle text-primary">{t.name}</span>
              ))}
            </div>
          )}
          <p className="text-muted" style={{ whiteSpace: "pre-wrap" }}>{p.description}</p>
        </div>
      </div>
    </div>
  );
}
