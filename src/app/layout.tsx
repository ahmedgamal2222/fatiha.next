import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MainShell } from "@/components/MainShell";

export const metadata: Metadata = {
  title: "Fatiha.id — منصة الفاتحة",
  description: "منصة الفاتحة — بوابتك لإتقان تلاوة سورة الفاتحة وفهم معانيها",
  icons: { icon: "/Logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b5d4f",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {TEMPLATE_CSS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&family=Reem+Kufi:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* ضبط الاتجاه قبل الرسم: عربي/أردو من اليمين، وبقية اللغات من اليسار */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=localStorage.getItem('fatiha_lang')||'ar';var rtl=l==='ar'||l==='ur';var d=document.documentElement;d.lang=l;d.dir=rtl?'rtl':'ltr';}catch(e){}})();",
          }}
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
