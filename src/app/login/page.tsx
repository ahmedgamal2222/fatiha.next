"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errorMessage, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("Invalid login attempt"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("Welcome back")}
      subtitle={t("Log in to continue your Al-Fatiha journey.")}
      brandTitle={t("Fatiha.id")}
      brandText={t("The platform for learning, reciting and certifying Surah Al-Fatiha.")}
      footer={<>{t("New here?")} <Link href="/register">{t("Create an account")}</Link></>}
    >
      <form onSubmit={onSubmit}>
        {errorMessage && <div className="alert alert-danger rounded-4 py-2"><i className="fas fa-circle-exclamation me-2" />{errorMessage}</div>}

        <div className="fh-auth__field">
          <i className="fas fa-envelope"></i>
          <input type="email" autoComplete="username" placeholder={t("Email")} value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="fh-auth__field">
          <i className="fas fa-lock"></i>
          <input type={showPw ? "text" : "password"} autoComplete="current-password" placeholder={t("Password")}
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="button" className="fh-auth__toggle" onClick={() => setShowPw((s) => !s)} aria-label={t("Show password")}>
            <i className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}></i>
          </button>
        </div>

        <div className="fh-auth__links">
          <span />
          <Link href="/forget-password">{t("Forgot your password?")}</Link>
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-right-to-bracket me-2" />}
          {loading ? t("Logging in...") : t("Log in")}
        </button>
      </form>
    </AuthShell>
  );
}
