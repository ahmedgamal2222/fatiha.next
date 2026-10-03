"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  imageUrl?: string | null;
  marketCategoryId: number;
}

export default function MarketplacePage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>("/api/marketplace", false)
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Fatiha Marketplace")}</h2>

      {loading ? (
        <p className="text-muted">{t("Loading...")}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-store fa-3x mb-3"></i>
          <p>{t("No products available at the moment.")}</p>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((p) => (
            <div className="col-12 col-sm-6 col-lg-3" key={p.id}>
              <Link href={`/marketplace/${p.id}`} className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 rounded-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl || "/cta.jpg"}
                    alt={p.title}
                    className="card-img-top rounded-top-4"
                    style={{ height: 200, objectFit: "cover" }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold text-truncate text-dark">{p.title}</h5>
                    {(p.shortDescription || p.description) && (
                      <p className="card-text text-muted small mb-3">{(p.shortDescription || p.description || "").slice(0, 80)}</p>
                    )}
                    <div className="mt-auto fw-bold text-primary fs-5">
                      {p.price} {p.currencyCode || "USD"}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
