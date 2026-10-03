import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MainShell } from "@/components/MainShell";

export const metadata: Metadata = {
  title: "Fatiha.id",
  description: "منصة الفاتحة — بوابتك لإتقان تلاوة سورة الفاتحة",
  icons: { icon: "/Logo.png" },
};

// أنماط أساسية فقط: Bootstrap (شبكة/مكوّنات) + Font Awesome (أيقونات) + Swiper (الكاروسيل).
// أُزيلت ملفات القالب القديمة (Global.css/site.css/style.css/styles.css...) لأنها كانت
// تُبهت التصميم وتتعارض مع نظام التصميم الاحترافي الجديد في globals.css.
const TEMPLATE_CSS = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {TEMPLATE_CSS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          <MainShell>{children}</MainShell>
          <Footer />
        </Providers>

        {/* مكتبات أساسية: Bootstrap (القوائم المنسدلة) + Swiper (الكاروسيل) */}
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
