"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";

const STEPS = [
  {
    icon: "fa-user-plus",
    title: "Create your account",
    text: "Register in seconds and complete your profile in your own language.",
  },
  {
    icon: "fa-headphones-simple",
    title: "Choose your recitation",
    text: "Listen to the ten Qiraat and select the narration you wish to be certified in.",
  },
  {
    icon: "fa-graduation-cap",
    title: "Take the qualifying exam",
    text: "Watch the short lesson, then pass the five-question exam with 60% or more.",
  },
  {
    icon: "fa-certificate",
    title: "Receive your Ijazah",
    text: "Download your certified Ijazah with a unique ID that verifies your achievement.",
  },
];

/** مسار المتعلّم في أربع خطوات واضحة. */
export function Journey() {
  const { t } = useI18n();

  return (
    <section className="fhx-section fhx-section--alt" id="journey">
      <div className="fhx-shell">
        <div className="fhx-shead">
          <span className="fhx-shead__eyebrow">
            <i className="fas fa-route" aria-hidden="true" />
            {t("How it works")}
          </span>
          <h2 className="fhx-shead__title">{t("Four steps to your Ijazah")}</h2>
          <div className="fhx-ornament" aria-hidden="true"><span /></div>
          <p className="fhx-shead__text">
            {t("A clear, guided path from your first visit to a verified certificate.")}
          </p>
        </div>

        <div className="fhx-journey">
          {STEPS.map((s) => (
            <article className="fhx-step" key={s.title}>
              <div className="fhx-step__ic">
                <i className={`fas ${s.icon}`} aria-hidden="true" />
              </div>
              <h3 className="fhx-step__title">{t(s.title)}</h3>
              <p className="fhx-step__text">{t(s.text)}</p>
            </article>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
          <Link href="/register" className="fhx-btn fhx-btn--emerald">
            <i className="fas fa-arrow-right" aria-hidden="true" />
            {t("Start now")}
          </Link>
        </div>
      </div>
    </section>
  );
}
