"use client";

import { useI18n } from "@/context/I18nContext";

/** شريط آية قرآنية بخط مصحفي — لمسة روحانية بين الأقسام. */
export function VerseBand() {
  const { t } = useI18n();

  return (
    <section className="fhx-verse" aria-label={t("A verse from the Holy Quran")}>
      <div className="fhx-shell">
        <span className="fhx-verse__mark">
          <i className="fas fa-book-open" aria-hidden="true" />
          {t("A verse from the Holy Quran")}
        </span>
        <p className="fhx-verse__text" dir="rtl">
          وَلَقَدْ آتَيْنَاكَ سَبْعًا مِّنَ الْمَثَانِي وَالْقُرْآنَ الْعَظِيمَ
        </p>
        <span className="fhx-verse__ref">{t("Surah Al-Hijr — Verse 87")}</span>
      </div>
    </section>
  );
}
