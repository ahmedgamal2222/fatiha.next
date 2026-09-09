"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Blog {
  id: number;
  title: string;
  reads: number;
  languageId: number;
  blogCategoryId: number;
}
interface Category {
  id: number;
  name: string;
}

const LANGS = [
  { id: 1, name: "English" },
  { id: 2, name: "العربية" },
];

function Inner() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<Blog[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: "", body: "", languageId: 2, blogCategoryId: 0 });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get<Blog[]>("/api/blogs", false).then((r) => setItems(r.data ?? [])).catch(() => {});
    api.get<Category[]>("/api/blogs/categories", false).then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/blogs", { ...form, blogCategoryId: Number(form.blogCategoryId) || (cats[0]?.id ?? 1) });
      setForm({ title: "", body: "", languageId: 2, blogCategoryId: 0 });
      setMsg(ar ? "تمت الإضافة" : "Created");
      load();
    } catch {
      setMsg(ar ? "فشل الإنشاء" : "Create failed");
    }
  }
  async function remove(id: number) {
    if (!confirm(ar ? "حذف المقال؟" : "Delete blog?")) return;
    await api.del(`/api/blogs/${id}`).catch(() => {});
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "إدارة المدوّنة" : "Manage Blog"}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{ar ? "مقال جديد" : "New blog"}</h5>
              <form onSubmit={create}>
                <input className="form-control mb-2" placeholder={ar ? "العنوان" : "Title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.blogCategoryId} onChange={(e) => setForm({ ...form, blogCategoryId: Number(e.target.value) })}>
                  <option value={0}>{ar ? "التصنيف" : "Category"}</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select className="form-select mb-2" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}>
                  {LANGS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <textarea className="form-control mb-2" rows={5} placeholder={ar ? "المحتوى" : "Body"} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
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

export default function AdminBlogsPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
