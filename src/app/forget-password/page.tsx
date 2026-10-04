"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { AuthShell } from "@/components/AuthShell";

export default function ForgetPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setError(""); setBusy(true);
    try {
      await api.post("/api/auth/forgot-password", { email }, false);
      setMsg(t("If the email exists, a reset link has been sent."));
    } catch (err) {
      setMsg(t("If the email exists, a reset link has been sent."));
      if (err instanceof ApiError && err.status >= 500) setError(t("Server error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t("Forgot password")}
      subtitle={t("Enter your email and we'll send you a reset link.")}
      brandTitle={t("Reset your access")}
      brandText={t("No worries — we'll help you get back into your account securely.")}
      footer={<><i className="fas fa-arrow-left me-1" /> <Link href="/login">{t("Back to login")}</Link></>}
    >
      <form onSubmit={submit}>
        {msg && <div className="alert alert-success rounded-4 py-2"><i className="fas fa-circle-check me-2" />{msg}</div>}
        {error && <div className="alert alert-danger rounded-4 py-2">{error}</div>}
        <div className="fh-auth__field">
          <i className="fas fa-envelope"></i>
          <input type="email" placeholder={t("Email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-lg w-100" disabled={busy}>
          {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-2" />}
          {busy ? t("Sending...") : t("Send reset link")}
        </button>
      </form>
    </AuthShell>
  );
}
