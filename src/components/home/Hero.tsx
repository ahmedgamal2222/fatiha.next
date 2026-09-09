"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export function Hero() {
  const { lang } = useI18n();
  const { isAuthed, user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const heroText =
    lang === "ar"
      ? "بوابتك لإتقان تلاوة سورة الفاتحة والحصول على شهادتك"
      : "Your Gateway to Mastering the Recitation of Surat Al-Fatiha";

  return (
    <div
      id="heroSection"
      className="cs-hero cs-style4 cs-center text-center cs-ripple__version"
      style={{
        backgroundImage: "url('/image1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <div className="container">
        <div className="cs-hero__text">
          <h1 className="cs-hero__title">{heroText}</h1>
          <div className="cs-btns cs-style1 cs-center">
            {isAuthed && !isAdmin && (
              <Link href="/fatiha-requests" className="cs-btn cs-style1 cs-no__border cs-color9 cs-primary__font">
                <i className="fas fa-file-alt me-2"></i>
                {lang === "ar" ? "تقديم طلب فاتحة" : "Apply for Fatiha"}
              </Link>
            )}
            {!isAuthed && (
              <Link href="/login" className="cs-btn cs-style1 cs-no__border cs-color9 cs-primary__font">
                <i className="fas fa-sign-in-alt me-2"></i>
                {lang === "ar" ? "سجّل الدخول لتقديم طلب" : "Login to Apply for Fatiha"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
