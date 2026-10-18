"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

/** دعوة ختامية فاخرة داخل قوس ذهبي. */
export function CtaSection() {
  const { t } = useI18n();
  const { isAuthed, isAdmin, loading: authLoading } = useAuth();

  return (
    <section className="fhx-cta">
      <div className="fhx-shell">
        <div className="fhx-cta__card">
          <span className="fhx-cta__icon">
            <i className="fas fa-award" aria-hidden="true" />
          </span>

          <h2 className="fhx-cta__title">
            {t(
              "Our certified instructors are available 24/7 to help you recite, understand, and certify you with Surat Al-Fatiha."
            )}
          </h2>

          <div className="fhx-cta__actions">
            {!authLoading && !isAuthed && (
              <Link href="/register" className="fhx-btn fhx-btn--gold">
                <i className="fas fa-user-plus" aria-hidden="true" />
                {t("Create your account")}
              </Link>
            )}
            {!authLoading && isAuthed && !isAdmin && (
              <Link href="/fatiha-requests/new" className="fhx-btn fhx-btn--gold">
                <i className="fas fa-file-signature" aria-hidden="true" />
                {t("Apply for Fatiha")}
              </Link>
            )}
            {!authLoading && isAdmin && (
              <Link href="/admin/fatiha-requests" className="fhx-btn fhx-btn--gold">
                <i className="fas fa-clipboard-check" aria-hidden="true" />
                {t("Manage Fatiha Requests")}
              </Link>
            )}
            <Link href="/al-qerat" className="fhx-btn fhx-btn--ghost">
              <i className="fas fa-headphones-simple" aria-hidden="true" />
              {t("Listen to the recitation")}
            </Link>
          </div>

          <span className="fhx-cta__note">
            <i className="fas fa-shield-halved" aria-hidden="true" />
            {t("Your certificate is verifiable with a unique ID.")}
          </span>
        </div>
      </div>
    </section>
  );
}
