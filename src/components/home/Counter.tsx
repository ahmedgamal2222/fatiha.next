"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { API_URL } from "@/lib/api";

interface Counters {
  student: number;
  mjazin: number;
  certificates: number;
}

function useCountUp(target: number, run: boolean, duration = 1400) {
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

export function Counter() {
  const { t } = useI18n();
  const [data, setData] = useState<Counters>({ student: 0, mjazin: 0, certificates: 0 });
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      { threshold: 0.3 }
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
    <section id="fh-stats" className="fh-stats" ref={ref}>
      <div className="fh-container">
        <div className="fh-stats__grid">
          {items.map((it, i) => (
            <div className="fh-stat" key={i}>
              <div className="fh-stat__icon">
                <i className={`fas ${it.icon}`}></i>
              </div>
              <div>
                <div className="fh-stat__num">{it.value.toLocaleString()}</div>
                <div className="fh-stat__label">{it.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
