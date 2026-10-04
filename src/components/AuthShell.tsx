"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useI18n } from "@/context/I18nContext";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  brandTitle: string;
  brandText: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** هيكل موحّد واحترافي لصفحات المصادقة — لوحة علامة تجارية + نموذج. */
export function AuthShell({ title, subtitle, brandTitle, brandText, children, footer }: AuthShellProps) {
  const { t } = useI18n();
  return (
    <div className="fh-auth">
      <div className="fh-auth__card">
        <div className="fh-auth__brand">
          <Link href="/" className="fh-auth__brand-logo" aria-label="Fatiha.id">
            <i className="fas fa-book-quran"></i>
          </Link>
          <h2>{brandTitle}</h2>
          <p>{brandText}</p>
          <ul className="fh-auth__brand-list">
            <li><i className="fas fa-circle-check"></i>{t("Request your Al-Fatiha Ijazah")}</li>
            <li><i className="fas fa-circle-check"></i>{t("Take the qualifying exam")}</li>
            <li><i className="fas fa-circle-check"></i>{t("Earn a verified certificate")}</li>
          </ul>
        </div>
        <div className="fh-auth__form">
          <h1>{title}</h1>
          {subtitle && <p className="fh-auth__sub">{subtitle}</p>}
          {children}
          {footer && <div className="fh-auth__foot">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
