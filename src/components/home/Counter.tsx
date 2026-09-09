"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";

interface Counters {
  Numberofstudent: number;
  Numberofmjazin: number;
  Numberofcertificates: number;
}

export function Counter() {
  const { lang } = useI18n();
  const [data, setData] = useState<Counters>({ Numberofstudent: 0, Numberofmjazin: 0, Numberofcertificates: 0 });

  useEffect(() => {
    fetch("https://api.fatiha.id/api/Home/Index")
      .then((r) => r.json())
      .then((res) =>
        setData({
          Numberofstudent: res?.numberofstudent ?? 0,
          Numberofmjazin: res?.numberofmjazin ?? 0,
          Numberofcertificates: res?.numberofcertificates ?? 0,
        })
      )
      .catch(() => {});
  }, []);

  const items = [
    { value: data.Numberofstudent, label: lang === "ar" ? "الأعضاء" : "Members" },
    { value: data.Numberofmjazin, label: lang === "ar" ? "المُجازون" : "Instructors" },
    { value: data.Numberofcertificates, label: lang === "ar" ? "الشهادات" : "Certificates" },
  ];

  return (
    <div className="cs-counter3__wrap__out">
      <div className="container">
        <div
          className="cs-counter3__wrap cs-color1 cs-bg__parallax"
          style={{ backgroundImage: "url('/counter-pattern.png')" }}
        >
          {items.map((it, i) => (
            <div className="cs-counter cs-style3" key={i}>
              <div className="cs-counter__number">
                <h2 className="cs-counter__title">{it.value.toLocaleString()}</h2>
                <div className="cs-counter__subtitle">{it.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="cs-height__130 cs-height__lg__80"></div>
    </div>
  );
}
