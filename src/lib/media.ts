import { API_URL } from "@/lib/api";

/**
 * يحلّ قيمة وسيط مخزّنة إلى رابط قابل للعرض مباشرة.
 * - الروابط المطلقة (https://… أو data:) تُعاد كما هي.
 * - المفاتيح النسبية (مثل `authorized-profile/xxx.jpg`) تُبنى على مسار الملفات العام /files.
 */
export function mediaUrl(value?: string | null): string | null {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^(https?:|data:|blob:)/i.test(v)) return v;
  return `${API_URL}/files/${v.replace(/^\/+/, "")}`;
}
