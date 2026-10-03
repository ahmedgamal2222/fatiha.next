"use client";

import { useI18n } from "@/context/I18nContext";

// القيم بمفاتيحها الإنجليزية الأصلية — تُترجم عبر الـ API لكل اللغات
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

// يزيل البادئة "Mission:" من القيمة المترجمة ليبقى النص فقط
function stripLabel(s: string): string {
  const idx = s.indexOf(":");
  return idx >= 0 && idx < 14 ? s.slice(idx + 1).trim() : s;
}

export function About() {
  const { t } = useI18n();

  return (
    <section className="fh-section">
      <div className="fh-container">
        <div className="fh-center">
          <span className="fh-eyebrow">
            <i className="fas fa-mosque"></i>
            Fatiha.ID
          </span>
          <h2 className="fh-heading">{t("About Fatiha.ID Platform")}</h2>
          <p className="fh-subheading">
            {t(
              "Fatiha.ID is a digital platform designed to promote a deep connection with Surat Al-Fatiha, a revered chapter of the Quran. Its primary goal is to empower and educate individuals worldwide, enabling them to accurately recite Surat Al-Fatiha, understand its profound meaning, and receive unique identification and certification."
            )}
          </p>
        </div>

        <div className="fh-about__grid">
          {VALUES.map((v, i) => (
            <div className="fh-value" key={i}>
              <div className="fh-value__icon">
                <i className={`fas ${v.icon}`}></i>
              </div>
              <h3 className="fh-value__title">{t(v.titleKey)}</h3>
              <p className="fh-value__text">{stripLabel(t(v.textKey))}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
