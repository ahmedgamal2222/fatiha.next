"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { API_URL } from "@/lib/api";

interface Counters {
  student: number;
  mjazin: number;
  certificates: number;
}

function useCountUp(target: number, run: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
}

/** شريط إحصاءات فاخر يعلو بطاقةً ورقية بحدود ذهبية. */
export function Counter() {
  const { t } = useI18n();
  const [data, setData] = useState<Counters>({ student: 0, mjazin: 0, certificates: 0 });
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/Home/Index`)
      .then((r) => r.json())
      .then((res) =>
        setData({
          student: res?.numberofstudent ?? 0,
          mjazin: res?.numberofmjazin ?? 0,
          certificates: res?.numberofcertificates ?? 0,
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const students = useCountUp(data.student, visible);
  const mjazin = useCountUp(data.mjazin, visible);
  const certs = useCountUp(data.certificates, visible);

  const items = [
    { value: students, label: t("Members"), icon: "fa-users" },
    { value: mjazin, label: t("Instructors"), icon: "fa-user-graduate" },
    { value: certs, label: t("Certificates"), icon: "fa-award" },
  ];

  return (
    <section id="fh-stats" className="fhx-stats" ref={ref} aria-label={t("Platform statistics")}>
      <div className="fhx-shell">
        <div className="fhx-stats__card">
          {items.map((it) => (
            <div className="fhx-stat" key={it.label}>
              <span className="fhx-stat__ic">
                <i className={`fas ${it.icon}`} aria-hidden="true" />
              </span>
              <div>
                <div className="fhx-stat__num">{it.value.toLocaleString()}</div>
                <div className="fhx-stat__label">{it.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
