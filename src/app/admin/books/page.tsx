"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Book {
  id: number;
  title: string;
  publisher?: string | null;
}
interface Category {
  id: number;
  nameAr?: string;
  nameEn?: string;
}

function Inner() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<Book[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: "", bookCategoryId: 0, languageId: 2, publisher: "", cover: "", fileUrl: "", description: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get<Book[]>("/api/books", false).then((r) => setItems(r.data ?? [])).catch(() => {});
    api.get<Category[]>("/api/books/categories", false).then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/books", { ...form, bookCategoryId: Number(form.bookCategoryId) || (cats[0]?.id ?? 1) });
      setForm({ title: "", bookCategoryId: 0, languageId: 2, publisher: "", cover: "", fileUrl: "", description: "" });
      setMsg(ar ? "تمت الإضافة" : "Created");
      load();
    } catch {
      setMsg(ar ? "فشل الإنشاء" : "Create failed");
    }
  }
  async function remove(id: number) {
    if (!confirm(ar ? "حذف الكتاب؟" : "Delete book?")) return;
    await api.del(`/api/books/${id}`).catch(() => {});
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "إدارة المكتبة" : "Manage Library"}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{ar ? "كتاب جديد" : "New book"}</h5>
              <form onSubmit={create}>
                <input className="form-control mb-2" placeholder={ar ? "العنوان" : "Title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.bookCategoryId} onChange={(e) => setForm({ ...form, bookCategoryId: Number(e.target.value) })}>
                  <option value={0}>{ar ? "التصنيف" : "Category"}</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{ar ? c.nameAr : c.nameEn}</option>
                  ))}
                </select>
                <input className="form-control mb-2" placeholder={ar ? "الناشر" : "Publisher"} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
                <input className="form-control mb-2" placeholder={ar ? "رابط الغلاف" : "Cover URL"} value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} />
                <input className="form-control mb-2" placeholder={ar ? "رابط الملف" : "File URL"} value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
                <textarea className="form-control mb-2" rows={3} placeholder={ar ? "الوصف" : "Description"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <button className="btn btn-primary w-100">{ar ? "إضافة" : "Create"}</button>
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
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(b.id)}>
                      <i className="fas fa-trash"></i>
                    </button>
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
