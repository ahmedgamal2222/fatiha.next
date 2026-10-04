"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";

function passwordStrength(pw: string): { pct: number; color: string; label: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const pct = (score / 5) * 100;
  if (score <= 2) return { pct, color: "#dc2626", label: "Weak" };
  if (score <= 3) return { pct, color: "#e9a319", label: "Fair" };
  if (score <= 4) return { pct, color: "#10a596", label: "Good" };
  return { pct, color: "#15803d", label: "Strong" };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const ar = lang === "ar";
  const [nameAr, setNameAr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errorMessage, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError(t("Passwords do not match")); return; }
    setLoading(true);
    try {
      await register({ email, password, nameAr: nameAr || undefined, preferredCulture: ar ? "ar-SA" : "en-US" });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("Create your account")}
      subtitle={t("Join Fatiha.id and start your Ijazah journey.")}
      brandTitle={t("Join Fatiha.id")}
      brandText={t("Create a free account to request your Ijazah and earn a verified certificate.")}
      footer={<>{t("Already have an account?")} <Link href="/login">{t("Log in")}</Link></>}
    >
      <form onSubmit={onSubmit}>
        {errorMessage && <div className="alert alert-danger rounded-4 py-2"><i className="fas fa-circle-exclamation me-2" />{errorMessage}</div>}

        <div className="fh-auth__field">
          <i className="fas fa-user"></i>
          <input type="text" placeholder={t("Full Name")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </div>

        <div className="fh-auth__field">
          <i className="fas fa-envelope"></i>
          <input type="email" autoComplete="username" placeholder={t("Email")} value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="fh-auth__field">
          <i className="fas fa-lock"></i>
          <input type={showPw ? "text" : "password"} autoComplete="new-password" placeholder={t("Password")}
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="button" className="fh-auth__toggle" onClick={() => setShowPw((s) => !s)} aria-label={t("Show password")}>
            <i className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}></i>
          </button>
        </div>
        {password && (
          <div className="mb-3">
            <div className="fh-strength"><div className="fh-strength__bar" style={{ width: `${strength.pct}%`, background: strength.color }} /></div>
            <span className="small" style={{ color: strength.color }}>{t(strength.label)}</span>
          </div>
        )}

        <div className="fh-auth__field">
          <i className="fas fa-lock"></i>
          <input type={showPw ? "text" : "password"} autoComplete="new-password" placeholder={t("Confirm Password")}
            value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100 mt-2" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-user-plus me-2" />}
          {loading ? t("Registering...") : t("Create account")}
        </button>
      </form>
    </AuthShell>
  );
}
