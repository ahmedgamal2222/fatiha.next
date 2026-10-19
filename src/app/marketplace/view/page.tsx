"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  buyUrl?: string | null;
  imageUrl?: string | null;
  images?: Array<{ id: number; imageUrl: string }>;
  tags?: { name: string }[];
}

function money(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ProductDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { t } = useI18n();
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    api.get<Product>(`/api/marketplace/${id}`, false)
      .then((r) => { setP(r.data ?? null); setActive(0); })
      .catch(() => setP(null))
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

  if (!p) {
    return (
      <div className="fh-page">
        <header className="fh-page__header">
          <div className="fh-container">
            <span className="fh-page__icon"><i className="fas fa-store" aria-hidden="true" /></span>
            <h1 className="fh-page__title">{t("Product not found")}</h1>
          </div>
        </header>
        <div className="fh-container">
          <Link href="/marketplace" className="btn btn-primary">
            <i className="fas fa-arrow-right fhx-back-icon" aria-hidden="true" />
            {t("Back to Marketplace")}
          </Link>
        </div>
      </div>
    );
  }

  const gallery = [p.imageUrl, ...(p.images ?? []).map((im) => im.imageUrl)]
    .filter((x): x is string => !!x);
  const main = fileUrl(gallery[active]) ?? "/cta.jpg";
  const hasDiscount = p.discountedPrice != null && p.discountedPrice < p.price;
  const current = hasDiscount ? Number(p.discountedPrice) : p.price;
  const discount = hasDiscount ? Math.round((1 - current / p.price) * 100) : 0;

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-bag-shopping" aria-hidden="true" /></span>
          <h1 className="fh-page__title">{p.title}</h1>
          {p.shortDescription ? <p className="fh-page__subtitle">{p.shortDescription}</p> : null}
        </div>
      </header>

      <div className="fh-container">
        <div className="fhx-product-detail">
          <div>
            <div className="fhx-product-detail__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={main} alt={p.title} />
              {discount > 0 && <span className="fhx-product__off fhx-product__off--lg">-{discount}%</span>}
            </div>
            {gallery.length > 1 && (
              <div className="fhx-product-detail__thumbs">
                {gallery.map((src, i) => {
                  const thumb = fileUrl(src);
                  if (!thumb) return null;
                  return (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      className={`fhx-book-detail__thumb${active === i ? " is-active" : ""}`}
                      onClick={() => setActive(i)}
                      aria-label={`${p.title} ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt="" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="fh-card fhx-product-detail__panel">
            <div className="fh-card__body">
              <div className="fhx-product-detail__price">
                <span className="fhx-product-detail__label">{t("Price")}</span>
                <div>
                  <strong>{money(current)} {p.currencyCode || "USD"}</strong>
                  {hasDiscount && <s>{money(p.price)}</s>}
                </div>
              </div>

              {p.tags && p.tags.length > 0 && (
                <div className="fhx-product-detail__tags">
                  {p.tags.map((tag, i) => (
                    <span key={`${tag.name}-${i}`} className="fhx-chip">
                      <i className="fas fa-tag" aria-hidden="true" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {p.description ? (
                <p className="fhx-product-detail__desc">{p.description}</p>
              ) : null}

              <div className="fhx-product-detail__actions">
                {p.buyUrl && (
                  <a href={p.buyUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                    <i className="fas fa-bag-shopping" aria-hidden="true" />
                    {t("Buy now")}
                  </a>
                )}
                <Link href="/marketplace" className="btn btn-outline-primary">
                  <i className="fas fa-arrow-right fhx-back-icon" aria-hidden="true" />
                  {t("Back to Marketplace")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<div className="fh-page" />}>
      <ProductDetail />
    </Suspense>
  );
}
