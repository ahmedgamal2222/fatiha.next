"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { AuthShell } from "@/components/AuthShell";

function ResetPasswordForm() {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setError("");
    if (password !== confirm) { setError(t("Passwords do not match")); return; }
    setBusy(true);
    try {
      await api.post("/api/auth/reset-password", { token, password }, false);
      setMsg(t("Password updated. You can log in."));
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError(t("Invalid or expired token"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t("Reset password")}
      subtitle={t("Choose a new password for your account.")}
      brandTitle={t("Almost there")}
      brandText={t("Set a strong new password and you're ready to continue.")}
      footer={<Link href="/login">{t("Back to login")}</Link>}
    >
      <form onSubmit={submit}>
        {msg && <div className="alert alert-success rounded-4 py-2"><i className="fas fa-circle-check me-2" />{msg}</div>}
        {error && <div className="alert alert-danger rounded-4 py-2"><i className="fas fa-circle-exclamation me-2" />{error}</div>}
        <div className="fh-auth__field">
          <i className="fas fa-lock"></i>
          <input type={showPw ? "text" : "password"} placeholder={t("New password")} value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="button" className="fh-auth__toggle" onClick={() => setShowPw((s) => !s)} aria-label={t("Show password")}>
            <i className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}></i>
          </button>
        </div>
        <div className="fh-auth__field">
          <i className="fas fa-lock"></i>
          <input type={showPw ? "text" : "password"} placeholder={t("Confirm password")} value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-lg w-100" disabled={busy || !token}>
          {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-key me-2" />}
          {busy ? t("Saving...") : t("Update password")}
        </button>
        {!token && <p className="text-danger mt-2 small text-center">{t("Invalid link")}</p>}
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container py-5 min-vh-100" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
