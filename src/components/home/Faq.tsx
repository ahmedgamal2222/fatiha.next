"use client";

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";

export function Faq() {
  const { lang } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    {
      ar: { q: "ما هي Fatiha.ID وما الذي تهدف إليه؟", a: "منصة رقمية تهدف إلى تعزيز الصلة العميقة بسورة الفاتحة، وتمكين الأفراد حول العالم من تلاوتها بدقة وفهم معناها والحصول على هوية وشهادة فريدة." },
      en: { q: "What is Fatiha.ID, and what does it aim to achieve?", a: "Fatiha.ID is a digital platform designed to promote a deep connection with Surat Al-Fatiha, enabling individuals worldwide to accurately recite it, understand its meaning, and receive unique identification and certification." },
    },
    {
      ar: { q: "كيف يمكنني المشاركة في مشروع Fatiha.ID؟", a: "زر موقع Fatiha.ID، أنشئ حساباً، واطّلع على الموارد التعليمية وقدّم طلب الاعتماد. يمكنك أيضاً الانضمام كمُجاز لمعالجة الطلبات وفق القراءات العشر." },
      en: { q: "How can I participate in the Fatiha.ID project?", a: "Visit the website, create an account, access the educational resources and apply for certification. You can also join as an instructor to process requests using the Ten Qiraat." },
    },
    {
      ar: { q: "هل الموارد متاحة بعدة لغات؟", a: "نعم، تلتزم المنصة بالشمولية وتوفّر المحتوى والدعم بعدة لغات. ويجب تلاوة سورة الفاتحة باللغة العربية." },
      en: { q: "Are the resources available in multiple languages?", a: "Yes, Fatiha.ID provides content and support in multiple languages. You must recite Surat Al-Fatiha in Arabic." },
    },
    {
      ar: { q: "ما أهمية الهوية والشهادة الفريدة؟", a: "تعترف الهوية والشهادة بتفانيك وإنجازك في إتقان تلاوة سورة الفاتحة وفهمها، وترمز لالتزامك ونموّك الروحي." },
      en: { q: "What is the significance of the unique ID and certification?", a: "They acknowledge your dedication and accomplishment in mastering the recitation and comprehension of Surat Al-Fatiha." },
    },
    {
      ar: { q: "هل المنصة متاحة لكل الأعمار والخلفيات؟", a: "بالتأكيد. صُمّمت Fatiha.ID لتكون متاحة وشاملة للأفراد من جميع الأعمار والخلفيات والقدرات." },
      en: { q: "Is Fatiha.ID accessible to all ages and backgrounds?", a: "Absolutely. Fatiha.ID is designed to be accessible and inclusive to individuals of all ages, backgrounds, and abilities." },
    },
  ];

  return (
    <div className="cs-parallax cs-style7">
      <div className="container">
        <div className="cs-height__130 cs-height__lg__80"></div>
        <div className="cs-section__heading cs-style1 cs-top-bar text-center">
          <h2 className="cs-section__title">{lang === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h2>
          <div className="cs-height__25 cs-height__lg__15"></div>
        </div>
        <div className="cs-height__70 cs-height__lg__50"></div>
        <div className="row">
          <div className="col-lg-6">
            <div className="cs-vertical__middle">
              <div className="cs-vertical__middle__in">
                <div className="cs-accordians cs-style1">
                  {faqs.map((f, i) => {
                    const item = lang === "ar" ? f.ar : f.en;
                    return (
                      <div className={`cs-accordian${open === i ? " active" : ""}`} key={i}>
                        <div className="cs-accordian__head" onClick={() => setOpen(open === i ? null : i)} style={{ cursor: "pointer" }}>
                          <h2 className="cs-accordian__title">{item.q}</h2>
                          <span className="cs-accordian__toggle">
                            <i className="fas fa-caret-down"></i>
                          </span>
                        </div>
                        {open === i && (
                          <div className="cs-accordian-body">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="cs-height__0 cs-height__lg__40"></div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="cs-right__full__width">
              <div className="cs-box cs-size4 cs-align__left cs-space85">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/main2.jpg" alt="" style={{ borderRadius: 36, marginTop: 8 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
