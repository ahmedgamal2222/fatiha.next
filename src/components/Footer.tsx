"use client";

import { useI18n } from "@/context/I18nContext";

const SOCIALS = [
  { href: "https://www.facebook.com/profile.php?id=61552038775677", icon: "fa-facebook-f", label: "Facebook" },
  { href: "https://x.com/fatihaplatform", icon: "fa-x-twitter", label: "X" },
  { href: "https://www.linkedin.com/company/106934327", icon: "fa-linkedin-in", label: "LinkedIn" },
  { href: "https://www.youtube.com/@Fatiha-id", icon: "fa-youtube", label: "YouTube" },
  { href: "https://www.tiktok.com/@fatihaplatform", icon: "fa-tiktok", label: "TikTok" },
];

/**
 * فوتر فاخر مركّز على الهوية والتواصل فقط.
 * أُزيلت منه مجموعتا «روابط سريعة» و«ابدأ رحلتك» (وبالتالي لا تظهر روابط
 * إنشاء حساب أو تسجيل الدخول لمن هو مسجّل بالفعل).
 */
export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="fhx-footer">
      <div className="fhx-shell">
        <div className="fhx-footer__top fhx-footer__top--single">
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
