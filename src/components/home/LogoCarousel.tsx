"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/context/I18nContext";

// Swiper يُحمَّل عالمياً عبر <Script> في التخطيط
declare const Swiper: any;

export function LogoCarousel() {
  const { t } = useI18n();
  const elRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<any>(null);
  const images = Array.from({ length: 10 }, (_, i) => `/${i + 1}.png`);

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      if (typeof Swiper !== "undefined" && elRef.current && !swiperRef.current) {
        clearInterval(timer);
        swiperRef.current = new Swiper(elRef.current, {
          slidesPerView: 2,
          spaceBetween: 20,
          loop: true,
          loopAddBlankSlides: false,
          autoplay: { delay: 2200, disableOnInteraction: false },
          breakpoints: {
            576: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            992: { slidesPerView: 5 },
          },
          pagination: { el: ".cs-logo-swiper .swiper-pagination", clickable: true },
        });
      } else if (++tries > 60) {
        clearInterval(timer);
      }
    }, 200);
    return () => {
      clearInterval(timer);
      if (swiperRef.current) {
        swiperRef.current.destroy(true, true);
        swiperRef.current = null;
      }
    };
  }, []);

  return (
    <section className="fh-section fh-badges">
      <div className="fh-container">
        <div className="fh-center">
          <span className="fh-eyebrow">
            <i className="fas fa-book-quran"></i>
            {t("Ten Qiraat")}
          </span>
          <h2 className="fh-heading">
            {t("Get your Al-Fatiha Badge according to one of the Ten Qiraat.")}
          </h2>
        </div>

        <div className="swiper cs-logo-swiper" ref={elRef} style={{ marginTop: 44 }}>
          <div className="swiper-wrapper">
            {images.map((img, i) => (
              <div className="swiper-slide" key={i}>
                <div className="cs-logo__carousel">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`qiraat-${i + 1}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="swiper-pagination"></div>
        </div>
      </div>
    </section>
  );
}
