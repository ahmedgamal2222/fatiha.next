"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

// شعار الفاتحة بكل الترجمات — يتبدّل تلقائياً كل 4 ثوانٍ
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

export function Hero() {
  const { t, openLanguageModal } = useI18n();
  const { isAuthed, user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_TEXTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="fh-hero">
      <div className="fh-hero__bg" style={{ backgroundImage: "url('/image1.jpg')" }} />
      <div className="fh-hero__overlay" />

      <div className="fh-hero__inner">
        <span className="fh-hero__badge">
          <i className="fas fa-certificate"></i>
          {t("Fatiha.ID: Your Gateway to Quranic Mastery")}
        </span>

        <h1 className="fh-hero__title" key={heroIndex}>
          {HERO_TEXTS[heroIndex]}
        </h1>

        <div className="fh-hero__actions">
          {isAuthed && !isAdmin && (
            <Link href="/fatiha-requests" className="fh-btn fh-btn--primary">
              <i className="fas fa-file-signature"></i>
              {t("Apply for Fatiha")}
            </Link>
          )}
          {!isAuthed && (
            <Link href="/login" className="fh-btn fh-btn--primary">
              <i className="fas fa-right-to-bracket"></i>
              {t("Login to Apply for Fatiha")}
            </Link>
          )}
          <button type="button" className="fh-btn fh-btn--ghost" onClick={openLanguageModal}>
            <i className="fas fa-globe"></i>
            {t("Languages")}
          </button>
        </div>
      </div>

      <a href="#fh-stats" className="fh-hero__scroll" aria-label="scroll">
        <i className="fas fa-chevron-down"></i>
      </a>
    </section>
  );
}
