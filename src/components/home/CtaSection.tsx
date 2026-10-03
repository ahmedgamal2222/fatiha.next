"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

export function CtaSection() {
  const { t } = useI18n();
  const { isAuthed, user } = useAuth();
  const isAdmin = user?.role === "Admin";

  return (
    <section className="fh-cta">
      <div className="fh-container">
        <div className="fh-cta__card">
          <div className="fh-cta__icon">
            <i className="fas fa-award"></i>
          </div>
          <div className="fh-cta__body">
            <h2 className="fh-cta__title">
              {t(
                "Our certified instructors are available 24/7 to help you recite, understand, and certify you with Surat Al-Fatiha."
              )}
            </h2>
            <div className="fh-hero__actions" style={{ justifyContent: "center", marginTop: 20 }}>
              {isAuthed && !isAdmin && (
                <Link href="/fatiha-requests" className="fh-btn fh-btn--primary">
                  <i className="fas fa-file-signature"></i>
                  {t("Apply for Fatiha")}
                </Link>
              )}
              {!isAuthed && (
                <Link href="/register" className="fh-btn fh-btn--primary">
                  <i className="fas fa-user-plus"></i>
                  {t("Register")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
