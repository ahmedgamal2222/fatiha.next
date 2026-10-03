"use client";

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";

// أسئلة وأجوبة بمفاتيحها الإنجليزية الأصلية — تُترجم عبر الـ API لكل اللغات
const FAQS = [
  {
    q: "What is Fatiha.ID, and what does it aim to achieve?",
    a: "Fatiha.ID is a digital platform designed to promote a deep connection with Surat Al-Fatiha, a revered chapter of the Quran. Its primary goal is to empower and educate individuals worldwide, enabling them to accurately recite Surat Al-Fatiha, understand its profound meaning, and receive unique identification and certification.",
  },
  {
    q: "How can I participate in the Fatiha.ID project?",
    a: "To participate, you can visit the Fatiha.ID website, create an account, and access the educational resources and apply for certification. You can also join as an instructor to help process requests using the Ten Qiraat.",
  },
  {
    q: "Are the resources on Fatiha.ID available in multiple languages?",
    a: "Yes, Fatiha.ID is committed to inclusivity and provides content and support in multiple languages (currently Arabic, English, Mandarin Chinese, Spanish, Hindi, French, Russian, Bengali, Portuguese, Urdu and Indonesian). This ensures that individuals from diverse linguistic backgrounds can access and benefit from the platforms resources. You must recite Surat Al-Fatiha in the Arabic language.",
  },
  {
    q: "What is the significance of the unique identification and certification offered by Fatiha.ID?",
    a: "The unique identification and certification acknowledge your dedication and accomplishment in mastering the recitation and comprehension of Surat Al-Fatiha. It serves as a symbol of your commitment to this important Surah and your spiritual growth.",
  },
  {
    q: "Is Fatiha.ID accessible to people of all ages and backgrounds?",
    a: "Absolutely. Fatiha.ID is designed to be accessible and inclusive to individuals of all ages, backgrounds, and abilities. It welcomes anyone who wishes to deepen their understanding of Surat Al-Fatiha, regardless of their prior knowledge or experience.",
  },
];

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="fh-section fh-faq">
      <div className="fh-container">
        <div className="fh-center">
          <span className="fh-eyebrow">
            <i className="fas fa-circle-question"></i>
            FAQ
          </span>
          <h2 className="fh-heading">{t("Frequently Ask Questions")}</h2>
        </div>

        <div className="fh-faq__wrap">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div className={`fh-faq__item${isOpen ? " open" : ""}`} key={i}>
                <button
                  type="button"
                  className="fh-faq__head"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{t(f.q)}</span>
                  <span className="fh-faq__icon">
                    <i className="fas fa-chevron-down"></i>
                  </span>
                </button>
                <div className="fh-faq__body" style={{ maxHeight: isOpen ? 600 : 0 }}>
                  <p>{t(f.a)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
