"use client";

import { useI18n } from "@/context/I18nContext";

const IMAGES = Array.from({ length: 10 }, (_, i) => `/${i + 1}.png`);

/**
 * سلايدر القراءات العشر — شريط متحرّك بـ CSS خالص (بلا مكتبات).
 * يعمل بشكل متطابق في كل اللغات والاتجاهات (RTL/LTR)، ويتوقف عند المرور،
 * ويتحوّل إلى تمرير أفقي عند تقليل الحركة.
 */
export function LogoCarousel() {
  const { t } = useI18n();

  return (
    <section className="fhx-section fhx-qiraat" id="qiraat">
      <div className="fhx-shell">
        <div className="fhx-shead">
          <span className="fhx-shead__eyebrow">
            <i className="fas fa-book-quran" aria-hidden="true" />
            {t("Ten Qiraat")}
          </span>
          <h2 className="fhx-shead__title">
            {t("Get your Al-Fatiha Badge according to one of the Ten Qiraat.")}
          </h2>
          <div className="fhx-ornament" aria-hidden="true"><span /></div>
          <p className="fhx-shead__text">
            {t("Ten authenticated recitations, one clear goal: mastering Surah Al-Fatiha.")}
          </p>
        </div>

        <div className="fhx-qiraat__frame">
          <div className="fhx-qiraat__track">
            {[...IMAGES, ...IMAGES].map((img, i) => {
              const dup = i >= IMAGES.length;
              const n = (i % IMAGES.length) + 1;
              return (
                <div className={`fhx-qiraat__item${dup ? " is-dup" : ""}`} key={`${img}-${i}`} aria-hidden={dup || undefined}>
                  <div className="fhx-qiraat__card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={dup ? "" : `Qiraah ${n}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="fhx-qiraat__ring" aria-hidden="true" />
                    <span className="fhx-qiraat__name">#{String(n).padStart(2, "0")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
