"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

export default function ResetPasswordPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
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
      setError(ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/auth/reset-password", { token, password }, false);
      setMsg(ar ? "تم تحديث كلمة المرور. يمكنك تسجيل الدخول." : "Password updated. You can log in.");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError(ar ? "رمز غير صالح أو منتهٍ" : "Invalid or expired token");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-fluid" style={{ marginTop: "8rem", marginBottom: "8rem" }}>
      <main role="main" className="pb-3">
        <div className="row">
          <div className="col-md-4">
            <h1>{ar ? "إعادة تعيين كلمة المرور" : "Reset password"}</h1>
            <hr />
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-floating mb-3">
                <input className="form-control" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <label>{ar ? "كلمة المرور الجديدة" : "New password"}</label>
              </div>
              <div className="form-floating mb-3">
                <input className="form-control" type="password" placeholder="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                <label>{ar ? "تأكيد كلمة المرور" : "Confirm password"}</label>
              </div>
              <button className="w-100 btn btn-lg btn-primary" disabled={busy || !token}>
                {busy ? (ar ? "جارٍ الحفظ..." : "Saving...") : ar ? "تحديث" : "Update"}
              </button>
              {!token && <p className="text-danger mt-2 small">{ar ? "رابط غير صالح" : "Invalid link"}</p>}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
