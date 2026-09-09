"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [successMessage, setSuccess] = useState("");
  const [errorMessage, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ar = lang === "ar";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError(ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({ email, password, preferredCulture: ar ? "ar-SA" : "en-US" });
      setSuccess(ar ? "تم إنشاء الحساب بنجاح" : "Account created successfully");
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : ar ? "فشل إنشاء الحساب" : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-fluid" style={{ marginTop: "8rem", marginBottom: "8rem" }}>
      <main role="main" className="pb-3">
        <h1>{ar ? "التسجيل" : "Register"}</h1>
        <div className="row">
          <div className="col-md-4">
            <form onSubmit={onSubmit}>
              <h2>{ar ? "إنشاء حساب جديد" : "Create a new account"}</h2>
              <hr />

              {successMessage && <div className="alert alert-success">{successMessage}</div>}
              {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

              <div className="form-floating mb-3">
                <input
                  className="form-control"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label>{ar ? "البريد الإلكتروني" : "Email"}</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  className="form-control"
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <label>{ar ? "كلمة المرور" : "Password"}</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  className="form-control"
                  type="password"
                  placeholder="confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <label>{ar ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
              </div>

              <button type="submit" className="w-100 btn btn-lg btn-primary" disabled={loading}>
                {loading ? (ar ? "جارٍ التسجيل..." : "Registering...") : ar ? "التسجيل" : "Register"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
