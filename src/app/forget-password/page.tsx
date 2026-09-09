"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

export default function ForgetPasswordPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setBusy(true);
    try {
      await api.post("/api/auth/forgot-password", { email }, false);
      setMsg(ar ? "إن كان البريد مسجّلاً، ستصلك رسالة لإعادة التعيين." : "If the email exists, a reset link has been sent.");
    } catch (err) {
      // نُظهر نفس الرسالة لأسباب أمنية حتى عند الفشل
      setMsg(ar ? "إن كان البريد مسجّلاً، ستصلك رسالة لإعادة التعيين." : "If the email exists, a reset link has been sent.");
      if (err instanceof ApiError && err.status >= 500) setError(ar ? "خطأ في الخادم" : "Server error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-fluid" style={{ marginTop: "8rem", marginBottom: "8rem" }}>
      <main role="main" className="pb-3">
        <div className="row">
          <div className="col-md-4">
            <h1>{ar ? "نسيت كلمة المرور" : "Forgot password"}</h1>
            <hr />
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-floating mb-3">
                <input className="form-control" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label>{ar ? "البريد الإلكتروني" : "Email"}</label>
              </div>
              <button className="w-100 btn btn-lg btn-primary" disabled={busy}>
                {busy ? (ar ? "جارٍ الإرسال..." : "Sending...") : ar ? "إرسال رابط إعادة التعيين" : "Send reset link"}
              </button>
            </form>
            <p className="mt-3">
              <Link href="/login">{ar ? "العودة لتسجيل الدخول" : "Back to login"}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
