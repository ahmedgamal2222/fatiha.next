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

// أنماط قالب أنغولار الأصلي (منسوخة إلى public) لمطابقة الشكل تماماً
const TEMPLATE_CSS = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
  "/css/Global.css",
  "/css/site.css",
  "/css/manage-audio.css",
  "/assets/css/lightgallery.min.css",
  "/assets/css/select2.min.css",
  "/assets/css/slick.css",
  "/assets/css/jquery-ui.min.css",
  "/assets/css/animate.min.css",
  "/assets/css/animated-headline.css",
  "/assets/css/style.css",
  "/styles.css",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {TEMPLATE_CSS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          <MainShell>{children}</MainShell>
          <Footer />
        </Providers>

        {/* مكتبات القالب: jQuery + Bootstrap bundle + Swiper + تأثير الماء (ripples) */}
        <Script src="https://code.jquery.com/jquery-3.6.4.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/ripples.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
