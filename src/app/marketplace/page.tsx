"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, fileUrl } from "@/lib/api";
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

function money(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** متجر الفاتحة — بطاقات منتجات بنفس هوية الموقع. */
export default function MarketplacePage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Product[]>("/api/marketplace", false)
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    api.get<Array<{ id: number; name: string }>>("/api/marketplace/categories", false)
      .then((r) => {
        const map: Record<number, string> = {};
        (r.data ?? []).forEach((c) => { map[c.id] = c.name; });
        setCats(map);
      })
      .catch(() => setCats({}));
  }, []);

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-store" aria-hidden="true" /></span>
          <h1 className="fh-page__title">{t("Fatiha Marketplace")}</h1>
          <p className="fh-page__subtitle">
            {t("Discover books, gifts, and resources that support your journey with Surah Al-Fatiha.")}
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
            <i className="fas fa-store" aria-hidden="true" />
            <p className="mb-0">{t("No products available at the moment.")}</p>
          </div>
        ) : (
          <div className="fhx-products">
            {items.map((p) => {
              const img = fileUrl(p.imageUrl) ?? "/cta.jpg";
              const hasDiscount = p.discountedPrice != null && p.discountedPrice < p.price;
              const current = hasDiscount ? Number(p.discountedPrice) : p.price;
              const discount = hasDiscount ? Math.round((1 - current / p.price) * 100) : 0;
              return (
                <article className="fhx-product" key={p.id}>
                  <Link href={`/marketplace/view?id=${p.id}`} className="fhx-product__media" aria-label={p.title}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={p.title} loading="lazy" />
                    <span className="fhx-product__badge">
                      <i className="fas fa-store" aria-hidden="true" />
                      {t("Product")}
                    </span>
                    {discount > 0 && <span className="fhx-product__off">-{discount}%</span>}
                  </Link>

                  <div className="fhx-product__body">
                    {cats[p.marketCategoryId] && (
                      <span className="fhx-product__cat">{cats[p.marketCategoryId]}</span>
                    )}
                    <h2 className="fhx-product__title">
                      <Link href={`/marketplace/view?id=${p.id}`}>{p.title}</Link>
                    </h2>
                    {(p.shortDescription || p.description) && (
                      <p className="fhx-product__desc">{(p.shortDescription || p.description)?.slice(0, 90)}</p>
                    )}

                    <div className="fhx-product__foot">
                      <div className="fhx-product__price">
                        <strong>{money(current)} {p.currencyCode || "USD"}</strong>
                        {hasDiscount && <s>{money(p.price)}</s>}
                      </div>
                      <Link href={`/marketplace/view?id=${p.id}`} className="btn btn-primary btn-sm">
                        <i className="fas fa-bag-shopping" aria-hidden="true" />
                        {t("View Details")}
                      </Link>
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
