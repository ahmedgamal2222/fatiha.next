"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Qerat {
  id: number;
  qeratName: string;
  description?: string | null;
  audioFile?: string | null;
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
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("The Ten Qiraat")}</h2>
      {loading ? (
        <p className="text-muted">{t("Loading...")}</p>
      ) : items.length === 0 ? (
        <p className="text-muted">{t("No data")}</p>
      ) : (
        <div className="row g-4">
          {items.map((q) => (
            <div className="col-12 col-md-6" key={q.id}>
              <div className="card h-100 shadow-sm border-0 rounded-4">
                <div className="card-body">
                  <h5 className="fw-bold">{q.qeratName}</h5>
                  {q.description && <p className="text-muted small">{q.description}</p>}
                  {q.audioFile && <audio controls src={q.audioFile} className="w-100 mt-2" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
