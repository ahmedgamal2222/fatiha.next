"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { api, setToken, ApiError } from "@/lib/api";
import { googleErrorMessage } from "@/lib/google-auth";
import { readQuery, stripQueryParams } from "@/lib/query";

type Phase = "working" | "done" | "error";

/**
 * صفحة استقبال تدفّق Google (‎/auth/callback/‎) — صفحة ثابتة بالكامل:
 * تقرأ الرمز المؤقّت من الرابط، تبادله بجلسة عبر POST، ثم تُعيد المستخدم لوجهته.
 * يُحذف الرمز من شريط العنوان فور قراءته ولا يظهر رمز الجلسة في الرابط إطلاقاً.
 */
export default function GoogleCallbackPage() {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("working");
  const [messageKey, setMessageKey] = useState("Completing Google sign-in...");
  const [nextPath, setNextPath] = useState("/");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // منع التنفيذ المزدوج في وضع StrictMode
    started.current = true;

    const params = readQuery();
    const code = params.get("code") || "";
    const error = params.get("error") || "";
    const next = params.get("next") || "/";
    const linked = params.get("linked") === "1";
    const created = params.get("created") === "1";
    setNextPath(next);
    stripQueryParams(undefined, "/auth/callback/"); // تنظيف الرابط فوراً

    if (error) {
      setMessageKey(googleErrorMessage(error) || "Something went wrong during Google sign-in. Please try again.");
      setPhase("error");
      return;
    }
    if (!code) {
      setMessageKey("Invalid sign-in request. Please start again from the login page.");
      setPhase("error");
      return;
    }

    (async () => {
      try {
        const res = await api.post<{ token: string }>("/api/auth/google/exchange", { code }, false);
        const token = res.data?.token;
        if (!token) throw new Error("missing token");
        setToken(token);
        await refresh();
        setMessageKey(
          created
            ? "Your account was created with Google."
            : linked
              ? "Google is now linked to your existing account."
              : "Signed in with Google"
        );
        setPhase("done");
        window.setTimeout(() => router.replace(next), 900);
      } catch (e) {
        setMessageKey(
          e instanceof ApiError && (e.status === 400 || e.status === 401)
            ? "The sign-in link has expired. Please try again."
            : "Something went wrong during Google sign-in. Please try again."
        );
        setPhase("error");
      }
    })();
  }, [refresh, router]);

  return (
    <AuthShell
      title={phase === "error" ? t("Sign in with Google") : t("Completing Google sign-in...")}
      subtitle={t("Please wait a moment while we finish signing you in.")}
      brandTitle={t("Fatiha.id")}
      brandText={t("The platform for learning, reciting and certifying Surah Al-Fatiha.")}
      footer={<Link href="/login">{t("Back to login")}</Link>}
    >
      {phase === "working" && (
        <div className="fh-auth__status">
          <div className="spinner-border text-primary" role="status" aria-hidden="true" />
        </div>
      )}

      {phase === "done" && (
        <div className="fh-auth__status">
          <div className="fh-auth__status-icon ok"><i className="fas fa-circle-check"></i></div>
          <p className="mb-3">{t(messageKey)}</p>
          <Link href={nextPath} className="btn btn-primary btn-lg w-100">{t("Continue")}</Link>
        </div>
      )}

      {phase === "error" && (
        <div className="fh-auth__status">
          <div className="fh-auth__status-icon err"><i className="fas fa-circle-exclamation"></i></div>
          <div className="alert alert-danger rounded-4 py-2 text-start">{t(messageKey)}</div>
          <Link href="/login" className="btn btn-primary btn-lg w-100">{t("Back to login")}</Link>
        </div>
      )}
    </AuthShell>
  );
}
