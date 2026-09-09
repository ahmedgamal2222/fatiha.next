"use client";

import { useI18n } from "@/context/I18nContext";

export function CtaSection() {
  const { lang } = useI18n();
  return (
    <div className="cs-dark__bg">
      <div className="container">
        <div className="cs-cta cs-style3 cs-color1">
          <div className="cs-cta__img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://cdn-icons-png.flaticon.com/256/9957/9957795.png" alt="Certificate" />
          </div>
          <div className="cs-cta__text">
            <h2 className="cs-cta__title">
              {lang === "ar"
                ? "مُجازونا المعتمدون متاحون على مدار الساعة لمساعدتك على تلاوة سورة الفاتحة وفهمها ومنحك الشهادة."
                : "Our certified instructors are available 24/7 to help you recite, understand, and certify you with Surat Al-Fatiha."}
            </h2>
            <div className="cs-cta__subtitle"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
