"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Qerat {
  id: number;
  qeratName: string;
  description?: string | null;
  audioFile?: string | null;
}

function audioSrc(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return API_URL + "/files/" + key.replace(/^\/+/, "");
}

export default function AlQeratPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Qerat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Qerat[]>("/api/al-qerat", false)
      .then((r) => setItems(r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-book-quran"></i></span>
          <h1 className="fh-page__title">{t("Ten Recitations (Al-Qerat)")}</h1>
          <p className="fh-page__subtitle">{t("Listen to each of the ten canonical recitations of Surah Al-Fatiha.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {loading ? (
          <div className="fh-empty"><i className="fas fa-spinner fa-spin"></i><p>{t("Loading...")}</p></div>
        ) : items.length === 0 ? (
          <div className="fh-empty"><i className="fas fa-book-open"></i><p>{t("No data")}</p></div>
        ) : (
          <div className="fh-qerat-grid">
            {items.map((q, i) => (
              <div className="fh-qerat" key={q.id}>
                <div className="fh-qerat__name">
                  <i className="fas fa-star-and-crescent"></i>
                  <span>{q.qeratName}</span>
                  <span className="badge bg-primary-subtle text-primary ms-auto">{i + 1}</span>
                </div>
                {q.description && <p className="text-muted small mb-2">{q.description}</p>}
                {audioSrc(q.audioFile) && <audio controls src={audioSrc(q.audioFile)!} className="w-100 mt-1" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
