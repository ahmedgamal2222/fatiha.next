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
  // في الصفحة الرئيسية الهيدر يطفو فوق الهيرو؛ في غيرها الهيدر لاصق ضمن التدفّق فلا حاجة لحشوة.
  return <main style={isHome ? undefined : { minHeight: "60vh" }}>{children}</main>;
}
