"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * الرأس (navbar) موضعه absolute فوق المحتوى — الصفحة الرئيسية تتكفّل بمساحته عبر الهيرو،
 * أما باقي الصفحات فتحتاج مسافة علوية حتى لا يصطدم المحتوى بالناف بار.
 */
export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isBuilder = pathname.startsWith("/admin/pages/builder");
  // الهيدر ثابت فوق المحتوى؛ الصفحة الرئيسية هيروها يتكفّل بالمساحة، وباقي الصفحات
  // تحصل على إزاحة علوية تساوي ارتفاع الهيدر حتى لا يغطي المحتوى.
  return (
    <main
      className={`fhx-main${isHome ? " fhx-main--home" : ""}${isBuilder ? " fhx-main--flush" : ""}`}
      style={isHome ? undefined : { minHeight: "60vh" }}
    >
      {children}
    </main>
  );
}
