import { API_URL } from "./api";

/**
 * مساعدات واجهة تسجيل الدخول عبر Google.
 * التدفّق: /login → API /api/auth/google/start → Google → API /google/callback
 *          → إعادة توجيه إلى /auth/callback/?code=… → تبادل الرمز عبر POST.
 */

/** رموز أخطاء التدفّق كما تُعاد من الـ API (القيمة = مفتاح ترجمة إنجليزي). */
export const GOOGLE_ERROR_KEYS: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured yet. Please contact support.",
  google_cancelled: "Google sign-in was cancelled.",
  google_email_unverified: "Your Google email is not verified, so we cannot link it to your account. Please sign in with your password.",
  google_no_email: "Your Google account did not share an email address.",
  account_disabled: "This account is disabled. Please contact support.",
  google_invalid_state: "Invalid sign-in request. Please start again from the login page.",
  google_failed: "Something went wrong during Google sign-in. Please try again.",
  expired: "The sign-in link has expired. Please try again.",
};

/** يحوّل رمز خطأ إلى مفتاح ترجمة (أو null إن لا خطأ). */
export function googleErrorMessage(error: string | null | undefined): string | null {
  if (!error) return null;
  return GOOGLE_ERROR_KEYS[error] ?? GOOGLE_ERROR_KEYS.google_failed;
}

/** يبني رابط بدء الدخول عبر Google (العودة دائماً إلى /auth/callback/ في هذا الموقع). */
export function googleStartUrl(opts: { next?: string; lang?: string; origin?: string } = {}): string {
  const origin = opts.origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams({
    redirect: `${origin}/auth/callback/`,
    next: opts.next || "/",
    lang: opts.lang || "en-US",
  });
  return `${API_URL}/api/auth/google/start?${params.toString()}`;
}
