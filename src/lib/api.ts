/**
 * عميل الـ API — يتواصل مع خادم Hono.
 * يمرّر رمز الجلسة عبر ترويسة Authorization (Bearer) ويعتمد الكوكيز أيضاً.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fatiha-api.info1703.workers.dev";

// قاعدة تخزين الملفات (DigitalOcean Spaces) — مطابقة لمشروع أنغولار
export const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL || "https://fatiha.sfo3.digitaloceanspaces.com/fatiha/";

/** يبني رابط ملف من مفتاح نسبي؛ الروابط المطلقة تُعاد كما هي (مثل صور DigitalOcean). */
export function storageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return STORAGE_URL.replace(/\/$/, "") + "/" + key.replace(/^\//, "");
}

const TOKEN_KEY = "fatiha_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  meta?: { page: number; pageSize: number; total: number };
}

export class ApiError extends Error {
  status: number;
  result: ApiResult;
  constructor(status: number, result: ApiResult) {
    super(result.message || `خطأ ${status}`);
    this.status = status;
    this.result = result;
  }
}

type ReqOptions = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function apiFetch<T = unknown>(path: string, opts: ReqOptions = {}): Promise<ApiResult<T>> {
  const { body, auth = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isForm && body !== undefined) h.set("Content-Type", "application/json");
  if (auth) {
    const token = getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: h,
    credentials: "include",
    body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let result: ApiResult<T>;
  try {
    result = (await res.json()) as ApiResult<T>;
  } catch {
    result = { success: res.ok, message: res.statusText };
  }

  if (!res.ok) throw new ApiError(res.status, result);
  return result;
}

export const api = {
  get: <T = unknown>(path: string, auth = true) => apiFetch<T>(path, { method: "GET", auth }),
  post: <T = unknown>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: "POST", body, auth }),
  put: <T = unknown>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: "PUT", body, auth }),
  patch: <T = unknown>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: "PATCH", body, auth }),
  del: <T = unknown>(path: string, auth = true) => apiFetch<T>(path, { method: "DELETE", auth }),
  upload: <T = unknown>(path: string, form: FormData) => apiFetch<T>(path, { method: "POST", body: form }),
};
