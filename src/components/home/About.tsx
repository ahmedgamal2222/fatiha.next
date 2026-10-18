"use client";

import { useI18n } from "@/context/I18nContext";

const VALUES = [
  {
    icon: "fa-bullseye",
    titleKey: "Mission",
    textKey:
      "Mission:To empower one million people worldwide to recite Surat Al-Fatiha accurately, comprehend its profound meaning, and provide each successful participant with a unique ID and a certification.",
  },
  {
    icon: "fa-eye",
    titleKey: "Vision",
    textKey:
      "Vision:To foster a global community of individuals who have mastered the recitation and understanding of Surat Al-Fatiha, a fundamental chapter of the Quran.",
  },
  {
    icon: "fa-heart",
    titleKey: "Values",
    textKey: "Values:Inclusivity, Education, Empowerment, Community, Precision, Certification.",
  },
  {
    icon: "fa-star",
    titleKey: "Slogan",
    textKey: "Slogan:'Fatiha.ID: Your Gateway to Quranic Mastery.'",
  },
];

function stripLabel(s: string): string {
  const idx = s.indexOf(":");
  return idx >= 0 && idx < 14 ? s.slice(idx + 1).trim() : s;
}

/** قسم «عن المنصة» ببطاقات مخطوطة وأيقونات أقواس. */
export function About() {
  const { t } = useI18n();

  return (
    <section className="fhx-section fhx-section--paper" id="about">
      <div className="fhx-shell">
        <div className="fhx-shead">
          <span className="fhx-shead__eyebrow">
            <i className="fas fa-mosque" aria-hidden="true" />
            Fatiha.ID
          </span>
          <h2 className="fhx-shead__title">{t("About Fatiha.ID Platform")}</h2>
          <div className="fhx-ornament" aria-hidden="true"><span /></div>
          <p className="fhx-shead__text">
            {t(
              "Fatiha.ID is a digital platform designed to promote a deep connection with Surat Al-Fatiha, a revered chapter of the Quran. Its primary goal is to empower and educate individuals worldwide, enabling them to accurately recite Surat Al-Fatiha, understand its profound meaning, and receive unique identification and certification."
            )}
          </p>
        </div>

        <div className="fhx-values">
          {VALUES.map((v, i) => (
            <article className="fhx-value" key={v.titleKey} data-index={String(i + 1).padStart(2, "0")}>
              <div className="fhx-value__ic">
                <i className={`fas ${v.icon}`} aria-hidden="true" />
              </div>
              <h3 className="fhx-value__title">{t(v.titleKey)}</h3>
              <p className="fhx-value__text">{stripLabel(t(v.textKey))}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
