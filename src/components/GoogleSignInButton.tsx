"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { googleStartUrl } from "@/lib/google-auth";
import { LANGUAGES, useI18n } from "@/context/I18nContext";

/**
 * زر "المتابعة باستخدام Google" + الفاصل النصّي قبله.
 * يظهر فقط إذا كان الخادم مُهيّأً لـ Google (‎/api/auth/google/status)
 * حتى لا يرى المستخدم زراً لا يعمل.
 */
export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/auth/google/status`)
      .then((r) => r.json())
      .then((res: { data?: { enabled?: boolean } }) => {
        if (alive) setEnabled(!!res?.data?.enabled);
      })
      .catch(() => {
        if (alive) setEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(() => {
    setBusy(true);
    const apiCode = LANGUAGES.find((l) => l.code === lang)?.apiCode ?? "en-US";
    window.location.href = googleStartUrl({ next, lang: apiCode });
  }, [lang, next]);

  if (!enabled) return null;

  return (
    <div className="mt-3">
      <div className="fh-divider"><span>{t("Or continue with email")}</span></div>
      <button type="button" className="fh-google-btn" onClick={start} disabled={busy} aria-label={t("Sign in with Google")}>
        {busy ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.9l-7.98 6.18C6.51 42.62 14.62 48 24 48z" />
          </svg>
        )}
        {busy ? t("Redirecting to Google...") : t("Continue with Google")}
      </button>
    </div>
  );
}
