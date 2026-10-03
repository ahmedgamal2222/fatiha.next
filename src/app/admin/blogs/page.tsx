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
  body?: string;
}
interface Category {
  id: number;
  name: string;
}

const LANGS = [
  { id: 1, label: "English" },
  { id: 2, label: "Arabic" },
];

function Inner() {
  const { t } = useI18n();
  const [items, setItems] = useState<Blog[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: "", body: "", languageId: 2, blogCategoryId: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get<Blog[]>("/api/blogs", false).then((r) => setItems(r.data ?? [])).catch(() => {});
    api.get<Category[]>("/api/blogs/categories", false).then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({ title: "", body: "", languageId: 2, blogCategoryId: 0 });
    setEditId(null);
  }

  function startEdit(b: Blog) {
    setForm({ title: b.title, body: b.body ?? "", languageId: b.languageId, blogCategoryId: b.blogCategoryId });
    setEditId(b.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const payload = { ...form, blogCategoryId: Number(form.blogCategoryId) || (cats[0]?.id ?? 1) };
    try {
      if (editId) {
        await api.put(`/api/blogs/${editId}`, payload);
        setMsg(t("Updated successfully"));
      } else {
        await api.post("/api/blogs", payload);
        setMsg(t("Created successfully"));
      }
      resetForm();
      load();
    } catch {
      setMsg(t("Operation failed"));
    }
  }
  async function remove(id: number) {
    if (!confirm(t("Delete blog?"))) return;
    await api.del(`/api/blogs/${id}`).catch(() => {});
    if (editId === id) resetForm();
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Manage Blog")}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editId ? t("Edit") : t("New blog")}</h5>
              <form onSubmit={save}>
                <input className="form-control mb-2" placeholder={t("Title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.blogCategoryId} onChange={(e) => setForm({ ...form, blogCategoryId: Number(e.target.value) })}>
                  <option value={0}>{t("Category")}</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select className="form-select mb-2" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}>
                  {LANGS.map((l) => (
                    <option key={l.id} value={l.id}>{t(l.label)}</option>
                  ))}
                </select>
                <textarea className="form-control mb-2" rows={5} placeholder={t("Body")} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
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

export default function AdminBlogsPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
