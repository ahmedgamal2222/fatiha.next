"use client";

import { useEffect, useState } from "react";

/**
 * قراءة معاملات البحث من الرابط بطريقة آمنة مع التصدير الثابت (output: export).
 * لا نستخدم useSearchParams لأنها تفرض Suspense أثناء توليد الصفحات ثابتاً.
 */

export function readQuery(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function readQueryParam(name: string): string | null {
  return readQuery().get(name);
}

/** يقرأ معاملاً من الرابط بعد التركيب (ويعيد القراءة عند التنقّل للخلف/الأمام). */
export function useQueryParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setValue(readQueryParam(name));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [name]);
  return value;
}

/** يحذف معاملات البحث من شريط العنوان دون إعادة تحميل أو إضافة سجل جديد. */
export function stripQueryParams(names?: string[], path?: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (names && names.length) for (const n of names) url.searchParams.delete(n);
  else url.search = "";
  const target = `${path ?? url.pathname}${url.search}`;
  window.history.replaceState({}, "", target);
}
