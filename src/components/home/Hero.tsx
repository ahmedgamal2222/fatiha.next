"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

// رسالة المنصة بكل اللغات — تتبدّل تلقائياً كل 5 ثوانٍ
const HERO_TEXTS = [
  "نهدف إلى إجازة مليون شخص حول العالم بسورة الفاتحة: قراءةً وفهماً",
  "We aim to certify one million people around the world in Surah Al-Fatiha: reading and understanding.",
  "我们的目标是让全世界一百万人通过阅读和理解开端章获得认证。",
  "Nuestro objetivo es certificar a un millón de personas en todo el mundo en la Sura Al-Fatiha: lectura y comprensión.",
  "हमारा लक्ष्य दुनिया भर में दस लाख लोगों को सूरह अल-फातिहा में प्रमाणित करना है: पठन और समझ।",
  "Nous visons à certifier un million de personnes dans le monde avec la Sourate Al-Fatiha : lecture et compréhension.",
  "Мы стремимся сертифицировать миллион человек по всему миру по суре Аль-Фатиха: чтение и понимание.",
  "আমরা সূরা আল-ফাতিহায় বিশ্বজুড়ে এক মিলিয়ন মানুষকে প্রত্যয়ন করার লক্ষ্য রাখি: পাঠ ও বোঝা।",
  "Nosso objetivo é certificar um milhão de pessoas em todo o mundo na Surata Al-Fatiha: leitura e compreensão.",
  "ہمارا مقصد دنیا بھر میں دس لاکھ افراد کو سورۃ الفاتحہ میں سند دینا ہے: پڑھائی اور سمجھ۔",
  "Kami bertujuan untuk mensertifikasi satu juta orang di seluruh dunia dalam Surah Al-Fatihah: membaca dan memahami.",
];

/** الواجهة الرئيسية: هيرو «مصحفي» فاخر بقوس محراب وتوهّج ذهبي. */
export function Hero() {
  const { t, openLanguageModal } = useI18n();
  const { isAuthed, isAdmin, loading: authLoading } = useAuth();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setInterval(() => setIndex((i) => (i + 1) % HERO_TEXTS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="fhx-hero">
      <div className="fhx-hero__bg" aria-hidden="true" />
      <div className="fhx-hero__veil" aria-hidden="true" />
      <div className="fhx-hero__pattern" aria-hidden="true" />

      <div className="fhx-shell fhx-hero__innr">
        <div className="fhx-hero__copy">
          <span className="fhx-hero__eyebrow">
            <span className="fhx-ic"><i className="fas fa-mosque" aria-hidden="true" /></span>
            {t("Fatiha.ID: Your Gateway to Quranic Mastery")}
          </span>

          <p className="fhx-hero__bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>

          <h1 className="fhx-hero__title" key={index}>{HERO_TEXTS[index]}</h1>

          <div className="fhx-hero__rule" aria-hidden="true"><span /></div>

          <p className="fhx-hero__sub">
            {t(
              "Recite Surah Al-Fatiha with precision, understand its meanings, and earn a certified Ijazah from anywhere in the world."
            )}
          </p>

          <div className="fhx-hero__cta">
            {!authLoading && !isAuthed && (
              <Link href="/login" className="fhx-btn fhx-btn--gold">
                <i className="fas fa-right-to-bracket" aria-hidden="true" />
                {t("Login to Apply for Fatiha")}
              </Link>
            )}
            {!authLoading && isAuthed && !isAdmin && (
              <Link href="/fatiha-requests/new" className="fhx-btn fhx-btn--gold">
                <i className="fas fa-file-signature" aria-hidden="true" />
                {t("Apply for Fatiha")}
              </Link>
            )}
            {!authLoading && isAdmin && (
              <Link href="/admin" className="fhx-btn fhx-btn--gold">
                <i className="fas fa-gauge-high" aria-hidden="true" />
                {t("Admin Panel")}
              </Link>
            )}

            <Link href="/al-qerat" className="fhx-btn fhx-btn--ghost">
              <i className="fas fa-headphones-simple" aria-hidden="true" />
              {t("Listen to the Ten Qiraat")}
            </Link>

            <button type="button" className="fhx-btn fhx-btn--ghost" onClick={openLanguageModal}>
              <i className="fas fa-globe" aria-hidden="true" />
              {t("Languages")}
            </button>
          </div>

          <div className="fhx-hero__meta">
            <span className="fhx-hero__meta-item">
              <span className="fhx-ic"><i className="fas fa-book-quran" aria-hidden="true" /></span>
              {t("Ten Qiraat")}
            </span>
            <span className="fhx-hero__meta-item">
              <span className="fhx-ic"><i className="fas fa-certificate" aria-hidden="true" /></span>
              {t("Certified Ijazah")}
            </span>
            <span className="fhx-hero__meta-item">
              <span className="fhx-ic"><i className="fas fa-globe" aria-hidden="true" /></span>
              {t("Worldwide")}
            </span>
          </div>
        </div>

        <div className="fhx-arch-wrap" aria-hidden="true">
          <div className="fhx-arch">
            <span className="fhx-arch__kicker">{t("Mother of the Book")}</span>
            <h2 className="fhx-arch__title">الفَاتِحَة</h2>
            <div className="fhx-arch__divider"><i className="fas fa-star" /></div>
            <p className="fhx-arch__verse">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="fhx-arch__note">
              {t("The Opening of the Book — seven verses recited in every prayer.")}
            </p>
            <span className="fhx-arch__seal"><i className="fas fa-kaaba" /></span>
          </div>
        </div>
      </div>

      <a href="#fh-stats" className="fhx-hero__scroll" aria-label={t("Scroll down")}>
        <i className="fas fa-chevron-down" aria-hidden="true" />
      </a>
    </section>
  );
}
