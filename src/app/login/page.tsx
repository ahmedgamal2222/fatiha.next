"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="container-fluid" style={{ marginTop: "2rem", marginBottom: "8rem" }}>
      <main role="main" className="pb-3">
        <h1>{t("Log in")}</h1>
        <div className="row">
          <div className="col-md-4">
            <section>
              <form onSubmit={onSubmit}>
                <h2>{t("Use a local account to log in.")}</h2>
                <hr />

                <div className="form-floating mb-3">
                  <input
                    className="form-control"
                    type="email"
                    id="Input_Email"
                    placeholder="name@example.com"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="Input_Email">{t("Email")}</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    className="form-control"
                    type="password"
                    id="Input_Password"
                    placeholder="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <label htmlFor="Input_Password">{t("Password")}</label>
                </div>

                <div className="checkbox">
                  <label>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />{" "}
                    {t("Remember me?")}
                  </label>
                </div>

                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                <div>
                  <button id="login-submit" type="submit" className="w-100 btn btn-lg btn-primary" disabled={loading}>
                    {loading ? (t("Logging in...")) : t("Log in")}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="col-md-6 col-md-offset-2">
            <section>
              <div>
                <p>
                  <Link href="/forget-password">{t("Forget your password")}</Link>
                </p>
                <p>
                  <Link href="/register">{t("Register as a new user")}</Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
