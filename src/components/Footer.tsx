"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";

const SOCIALS = [
  { href: "https://www.facebook.com/profile.php?id=61552038775677", icon: "fa-facebook-f", label: "Facebook" },
  { href: "https://x.com/fatihaplatform", icon: "fa-x-twitter", label: "X" },
  { href: "https://www.linkedin.com/company/106934327", icon: "fa-linkedin-in", label: "LinkedIn" },
  { href: "https://www.youtube.com/@Fatiha-id", icon: "fa-youtube", label: "YouTube" },
  { href: "https://www.tiktok.com/@fatihaplatform", icon: "fa-tiktok", label: "TikTok" },
];

const QUICK_LINKS = [
  { href: "/", icon: "fa-house", key: "Home" },
  { href: "/al-qerat", icon: "fa-book-quran", key: "Ten Recitations (Al-Qerat)" },
  { href: "/books", icon: "fa-book-open-reader", key: "Fatiha Library" },
  { href: "/blogs", icon: "fa-newspaper", key: "Fatiha Blog" },
  { href: "/marketplace", icon: "fa-store", key: "Fatiha Marketplace" },
];

const START_LINKS = [
  { href: "/fatiha-requests/new", icon: "fa-file-signature", key: "Apply for Fatiha" },
  { href: "/fatiha-exam", icon: "fa-graduation-cap", key: "Take Qualifying Exam" },
  { href: "/authorized-users/apply", icon: "fa-user-graduate", key: "Apply" },
  { href: "/register", icon: "fa-user-plus", key: "Register" },
  { href: "/login", icon: "fa-right-to-bracket", key: "Log in" },
];

/** فوتر فاخر بطابع مخطوطات إسلامية. */
export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="fhx-footer">
      <div className="fhx-shell">
        <div className="fhx-footer__top">
          <div>
            <div className="fhx-footer__brand">
              <span className="fhx-footer__seal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Logo.png" alt="Fatiha.id" />
              </span>
              <span className="fhx-footer__brand-text">
                <strong>{t("Fathia")}</strong>
                <small>FATIHA.ID</small>
              </span>
            </div>
            <p className="fhx-footer__desc">
              {t(
                "A global platform to recite Surah Al-Fatiha accurately, understand its meanings, and earn a certified Ijazah in one of the ten Qiraat."
              )}
            </p>
            <div className="fhx-footer__socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.href}
                  className="fhx-footer__social"
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                >
                  <i className={`fab ${s.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="fhx-footer__title">
              <i className="fas fa-compass" aria-hidden="true" />
              {t("Quick links")}
            </h3>
            {QUICK_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="fhx-footer__link">
                <i className={`fas ${l.icon}`} aria-hidden="true" />
                <span>{t(l.key)}</span>
              </Link>
            ))}
          </div>

          <div>
            <h3 className="fhx-footer__title">
              <i className="fas fa-star-and-crescent" aria-hidden="true" />
              {t("Start your journey")}
            </h3>
            {START_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="fhx-footer__link">
                <i className={`fas ${l.icon}`} aria-hidden="true" />
                <span>{t(l.key)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="fhx-footer__ornament" />

        <div className="fhx-footer__bottom">
          <span>
            <i className="far fa-copyright" aria-hidden="true" />
            {new Date().getFullYear()} Fatiha.ID — {t("All Rights Reserved.")}
          </span>
          <span>
            <i className="fas fa-heart" aria-hidden="true" />
            {t("Made with care for the Holy Quran")}
          </span>
        </div>
      </div>
    </footer>
  );
}
