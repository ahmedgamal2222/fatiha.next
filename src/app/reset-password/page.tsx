"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

function ResetPasswordForm() {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    if (password !== confirm) {
      setError(t("Passwords do not match"));
      return;
    }
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
    <div className="container-fluid" style={{ marginTop: "2rem", marginBottom: "8rem" }}>
      <main role="main" className="pb-3">
        <div className="row">
          <div className="col-md-4">
            <h1>{t("Reset password")}</h1>
            <hr />
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-floating mb-3">
                <input className="form-control" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <label>{t("New password")}</label>
              </div>
              <div className="form-floating mb-3">
                <input className="form-control" type="password" placeholder="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                <label>{t("Confirm password")}</label>
              </div>
              <button className="w-100 btn btn-lg btn-primary" disabled={busy || !token}>
                {busy ? (t("Saving...")) : t("Update")}
              </button>
              {!token && <p className="text-danger mt-2 small">{t("Invalid link")}</p>}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container py-5 min-vh-100" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
