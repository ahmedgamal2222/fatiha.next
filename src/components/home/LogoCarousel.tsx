"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/context/I18nContext";

// Swiper يُحمَّل عالمياً عبر <Script> في التخطيط
declare const Swiper: any;

export function LogoCarousel() {
  const { lang } = useI18n();
  const initialized = useRef(false);
  const images = Array.from({ length: 10 }, (_, i) => `/${i + 1}.png`);

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      if (typeof Swiper !== "undefined" && !initialized.current) {
        initialized.current = true;
        clearInterval(timer);
        // eslint-disable-next-line no-new
        new Swiper(".cs-logo-swiper", {
          slidesPerView: 4,
          spaceBetween: 10,
          loop: true,
          autoplay: { delay: 3000, disableOnInteraction: false },
          breakpoints: { 480: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
          pagination: { el: ".swiper-pagination", clickable: true },
        });
      } else if (++tries > 40) {
        clearInterval(timer);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <div className="cs-height__120 cs-height__lg__70"></div>
      <div className="cs-section__heading cs-style1 text-center">
        <h2 className="cs-section__title">
          {lang === "ar"
            ? "احصل على شارة الفاتحة وفق إحدى القراءات العشر."
            : "Get your Al-Fatiha Badge according to one of the Ten Qiraat."}
        </h2>
      </div>
      <div className="cs-height__70 cs-height__lg__50"></div>

      <div className="swiper-container cs-logo-swiper">
        <div className="swiper-wrapper">
          {images.map((img, i) => (
            <div className="swiper-slide" key={i}>
              <div className="cs-logo__carousel cs-style1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="logo" />
              </div>
            </div>
          ))}
        </div>
        <div className="swiper-pagination"></div>
      </div>

      <div className="cs-height__130 cs-height__lg__80"></div>
    </div>
  );
}
