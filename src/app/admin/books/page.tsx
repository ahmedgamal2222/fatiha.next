"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: number;
  title: string;
  publisher?: string | null;
  bookCategoryId?: number;
  languageId?: number;
  cover?: string | null;
  fileUrl?: string | null;
  description?: string | null;
}
interface Category {
  id: number;
  nameAr?: string;
  nameEn?: string;
}

/** أسماء اللغات بحسب EnumCommon.Languagelist (id == languageName). */
const LANG_NAMES: Record<number, string> = {
  1: "العربية", 2: "English", 3: "中文", 4: "Español", 5: "हिन्दी", 6: "Français",
  7: "Русский", 8: "বাংলা", 9: "Português", 10: "اردو", 11: "Bahasa Indonesia",
};
const LANG_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function Inner() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<Book[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: "", bookCategoryId: 0, languageId: 2, publisher: "", cover: "", fileUrl: "", description: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const load = useCallback(() => {
    api.get<Book[]>("/api/books", false).then((r) => setItems(r.data ?? [])).catch(() => {});
    api.get<Category[]>("/api/books/categories", false).then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({ title: "", bookCategoryId: 0, languageId: 2, publisher: "", cover: "", fileUrl: "", description: "" });
    setEditId(null);
  }

  function startEdit(b: Book) {
    setForm({
      title: b.title,
      bookCategoryId: b.bookCategoryId ?? 0,
      languageId: b.languageId ?? 2,
      publisher: b.publisher ?? "",
      cover: b.cover ?? "",
      fileUrl: b.fileUrl ?? "",
      description: b.description ?? "",
    });
    setEditId(b.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const payload = { ...form, bookCategoryId: Number(form.bookCategoryId) || (cats[0]?.id ?? 1) };
    try {
      if (editId) {
        await api.put(`/api/books/${editId}`, payload);
        setMsg(t("Updated successfully"));
      } else {
        await api.post("/api/books", payload);
        setMsg(t("Created successfully"));
      }
      resetForm();
      load();
    } catch {
      setMsg(t("Operation failed"));
    }
  }
  async function remove(id: number) {
    if (!confirm(t("Delete book?"))) return;
    await api.del(`/api/books/${id}`).catch(() => {});
    if (editId === id) resetForm();
    load();
  }

  /** توليد وصف الكتاب بالذكاء الاصطناعي بلغة الكتاب المختارة. */
  async function aiFill() {
    if (!form.title.trim()) {
      setMsg(t("Title is required"));
      return;
    }
    setAiBusy(true);
    setMsg("");
    try {
      const r = await api.post<{ description?: string }>("/api/books/ai", {
        title: form.title,
        prompt: aiHint.trim() || undefined,
        languageId: Number(form.languageId) || 1,
      });
      const desc = r.data?.description;
      if (desc) {
        setForm((f) => ({ ...f, description: desc }));
        setMsg(t("Generated with AI"));
      } else {
        setMsg(t("AI generation failed"));
      }
    } catch {
      setMsg(t("AI generation failed"));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Manage Library")}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editId ? t("Edit") : t("New book")}</h5>
              <form onSubmit={save}>
                <input className="form-control mb-2" placeholder={t("Title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.bookCategoryId} onChange={(e) => setForm({ ...form, bookCategoryId: Number(e.target.value) })}>
                  <option value={0}>{t("Category")}</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{ar ? c.nameAr : c.nameEn}</option>
                  ))}
                </select>
                <input className="form-control mb-2" placeholder={t("Publisher")} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
                <input className="form-control mb-2" placeholder={t("Cover URL")} value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} />
                <input className="form-control mb-2" placeholder={t("File URL")} value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
                <select className="form-select mb-2" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}>
                  {LANG_IDS.map((id) => (
                    <option key={id} value={id}>{LANG_NAMES[id]}</option>
                  ))}
                </select>
                <div className="input-group mb-2">
                  <input className="form-control" placeholder={t("Topic (optional)")} value={aiHint} onChange={(e) => setAiHint(e.target.value)} />
                  <button type="button" className="btn btn-outline-primary" disabled={aiBusy} onClick={aiFill}>
                    {aiBusy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="fas fa-wand-magic-sparkles me-1" />}
                    {t("Write with AI")}
                  </button>
                </div>
                <textarea className="form-control mb-2" rows={6} placeholder={t("Description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1">{editId ? t("Update") : t("Create")}</button>
                  {editId && (
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>{t("Cancel")}</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {items.map((b) => (
                  <li key={b.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="text-truncate">{b.title}</span>
                    <span className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(b)}>
                        <i className="fas fa-pen"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(b.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBooksPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
