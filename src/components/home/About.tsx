"use client";

import { useI18n } from "@/context/I18nContext";

export function About() {
  const { lang, dir } = useI18n();
  const values = [
    {
      color: "cs-primary__bg",
      ar: "الرسالة: تمكين مليون شخص حول العالم من تلاوة سورة الفاتحة بإتقان وفهم معانيها، ومنح كل مشارك ناجح هوية فريدة وشهادة.",
      en: "Mission: To empower one million people worldwide to recite Surat Al-Fatiha accurately, comprehend its meaning, and provide each participant with a unique ID and certification.",
    },
    {
      color: "cs-green__bg",
      ar: "الرؤية: بناء مجتمع عالمي أتقن تلاوة سورة الفاتحة وفهمها، وهي من أعظم سور القرآن.",
      en: "Vision: To foster a global community who have mastered the recitation and understanding of Surat Al-Fatiha.",
    },
    {
      color: "cs-yellow__bg",
      ar: "القيم: الشمولية، التعليم، التمكين، المجتمع، الدقّة، الاعتماد.",
      en: "Values: Inclusivity, Education, Empowerment, Community, Precision, Certification.",
    },
    {
      color: "cs-pink__bg",
      ar: "الشعار: Fatiha.ID — بوابتك لإتقان القرآن",
      en: "Slogan: Fatiha.ID: Your Gateway to Quranic Mastery",
    },
  ];

  return (
    <div className="container">
      <div className="cs-section__heading cs-style1 cs-top-bar text-center" style={{ direction: dir }}>
        <h2 className="cs-section__title">{lang === "ar" ? "عن منصة Fatiha.ID" : "About Fatiha.ID Platform"}</h2>
        <div className="cs-height__25 cs-height__lg__15"></div>
        <div className="cs-section__subtitle">
          {lang === "ar"
            ? "منصة Fatiha.ID مصمّمة لتكون متاحة وشاملة لجميع الأعمار والخلفيات والقدرات، وترحّب بكل من يرغب في تعميق فهمه لسورة الفاتحة."
            : "Fatiha.ID is designed to be accessible and inclusive to individuals of all ages, backgrounds, and abilities."}
        </div>
      </div>

      <div className="cs-height__70 cs-height__lg__50"></div>

      <div className="row">
        <div className="col-lg-6">
          <div className="cs-image2 cs-space__right50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main1.jpg" alt="Main" />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="cs-vertical__middle">
            <div className="cs-vertical__middle__in">
              <div className="cs-height__30 cs-height__lg__30"></div>
              <div style={{ direction: dir }}>
                <ul className="cs-list cs-style2 cs-mp0">
                  {values.map((v, i) => (
                    <li key={i}>
                      <i className={`${v.color} fas fa-check`}></i>
                      {lang === "ar" ? v.ar : v.en}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cs-height__130 cs-height__lg__80"></div>
    </div>
  );
}
