"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

/** يحمي صفحات الأدمن: يعيد التوجيه لغير الأدمن. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (!isAdmin) router.push("/");
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return <div className="container py-5 min-vh-100">{t("Loading...")}</div>;
  }
  return <>{children}</>;
}
