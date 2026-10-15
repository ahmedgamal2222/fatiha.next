"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { MediaPicker, MediaListPicker } from "@/components/MediaPicker";
import { CategoryManager } from "@/components/CategoryManager";

interface Product {
  id: number;
  title: string;
  price: number;
  currencyCode?: string | null;
  marketCategoryId?: number;
  shortDescription?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  images?: Array<{ id: number; imageUrl: string }>;
}
interface Category {
  id: number;
  name?: string;
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
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: "", marketCategoryId: 0, price: 0, shortDescription: "", description: "", imageUrl: "", currencyCode: "USD", imageUrls: [] as string[] });
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [aiLang, setAiLang] = useState(1);
  const [aiBusy, setAiBusy] = useState(false);

  const load = useCallback(() => {
    api.get<Product[]>("/api/marketplace", false).then((r) => setItems(r.data ?? [])).catch(() => {});
    api.get<Category[]>("/api/marketplace/categories", false).then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({ title: "", marketCategoryId: 0, price: 0, shortDescription: "", description: "", imageUrl: "", currencyCode: "USD", imageUrls: [] });
    setEditId(null);
  }

  async function startEdit(p: Product) {
    setForm({
      title: p.title,
      marketCategoryId: p.marketCategoryId ?? 0,
      price: p.price,
      shortDescription: p.shortDescription ?? "",
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      currencyCode: p.currencyCode ?? "USD",
      imageUrls: [],
    });
    setEditId(p.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    // نجلب التفاصيل لتحميل معرض الصور المرتبط بالمنتج
    try {
      const r = await api.get<Product>(`/api/marketplace/${p.id}`, false);
      const imgs = Array.isArray(r.data?.images) ? r.data!.images.map((i) => i.imageUrl) : [];
      setForm((f) => ({ ...f, imageUrls: imgs }));
    } catch {
      /* تجاهل */
    }
  }

  /** توليد وصف المنتج (مختصر + كامل) بالذكاء الاصطناعي باللغة المختارة. */
  async function aiFill() {
    if (!form.title.trim()) {
      setMsg(t("Title is required"));
      return;
    }
    setAiBusy(true);
    setMsg("");
    try {
      const r = await api.post<{ shortDescription?: string; description?: string }>("/api/marketplace/ai", {
        title: form.title,
        prompt: aiHint.trim() || undefined,
        languageId: aiLang,
        extra: { price: form.price, currency: form.currencyCode },
      });
      const desc = r.data?.description;
      const short = r.data?.shortDescription;
      if (desc || short) {
        setForm((f) => ({ ...f, description: desc ?? f.description, shortDescription: short ?? f.shortDescription }));
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!Number(form.marketCategoryId) && !cats[0]) {
      setMsg(t("Please add a category first"));
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      marketCategoryId: Number(form.marketCategoryId) || (cats[0]?.id ?? 1),
    };
    try {
      if (editId) {
        await api.put(`/api/marketplace/${editId}`, payload);
        setMsg(t("Updated successfully"));
      } else {
        await api.post("/api/marketplace", payload);
        setMsg(t("Created successfully"));
      }
      resetForm();
      load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : t("Operation failed"));
    }
  }
  async function remove(id: number) {
    if (!confirm(t("Delete product?"))) return;
    await api.del(`/api/marketplace/${id}`).catch(() => {});
    if (editId === id) resetForm();
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Manage Marketplace")}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <CategoryManager base="/api/marketplace" categories={cats} onChanged={load} />
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editId ? t("Edit") : t("New product")}</h5>
              <form onSubmit={save}>
                <input className="form-control mb-2" placeholder={t("Title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.marketCategoryId} onChange={(e) => setForm({ ...form, marketCategoryId: Number(e.target.value) })}>
                  <option value={0}>{t("Category")}</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || (ar ? c.nameAr : c.nameEn)}</option>
                  ))}
                </select>
                <div className="input-group mb-2">
                  <input type="number" step="0.01" className="form-control" placeholder={t("Price")} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
                  <input className="form-control" style={{ maxWidth: 90 }} value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase().slice(0, 3) })} />
                </div>
                <div className="mb-2">
                  <MediaPicker
                    label={t("Image")}
                    value={form.imageUrl}
                    onChange={(v) => setForm({ ...form, imageUrl: v })}
                    folder="products"
                    previewHeight={150}
                  />
                </div>
                <div className="mb-3">
                  <label className="bz-label">{t("Gallery images")}</label>
                  <MediaListPicker value={form.imageUrls} onChange={(urls) => setForm({ ...form, imageUrls: urls })} folder="products" />
                </div>
                <input className="form-control mb-2" placeholder={t("Short description")} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
                <div className="input-group mb-2">
                  <input className="form-control" placeholder={t("Topic (optional)")} value={aiHint} onChange={(e) => setAiHint(e.target.value)} />
                  <select className="form-select flex-grow-0" style={{ maxWidth: 140 }} value={aiLang} onChange={(e) => setAiLang(Number(e.target.value))}>
                    {LANG_IDS.map((id) => (
                      <option key={id} value={id}>{LANG_NAMES[id]}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline-primary" disabled={aiBusy} onClick={aiFill}>
                    {aiBusy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="fas fa-wand-magic-sparkles me-1" />}
                    {t("Write with AI")}
                  </button>
                </div>
                <textarea className="form-control mb-2" rows={5} placeholder={t("Description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
                {items.map((p) => (
                  <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="text-truncate">
                      {p.title} — <span className="text-muted small">{p.price} {p.currencyCode || "USD"}</span>
                    </span>
                    <span className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(p)}>
                        <i className="fas fa-pen"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(p.id)}>
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

export default function AdminMarketplacePage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
