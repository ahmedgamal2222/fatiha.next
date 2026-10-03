"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface StaticPage {
  id: number;
  title: string;
  languageId?: number;
  content?: string;
}

function Inner() {
  const { t } = useI18n();
  const [items, setItems] = useState<StaticPage[]>([]);
  const [form, setForm] = useState({ title: "", content: "", languageId: 2 });
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get<StaticPage[]>("/api/pages", false).then((r) => setItems(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({ title: "", content: "", languageId: 2 });
    setEditId(null);
  }

  function startEdit(p: StaticPage) {
    setForm({ title: p.title, content: p.content ?? "", languageId: p.languageId ?? 2 });
    setEditId(p.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      if (editId) {
        await api.put(`/api/pages/${editId}`, form);
        setMsg(t("Updated successfully"));
      } else {
        await api.post("/api/pages", form);
        setMsg(t("Created successfully"));
      }
      resetForm();
      load();
    } catch {
      setMsg(t("Operation failed"));
    }
  }
  async function remove(id: number) {
    if (!confirm(t("Delete page?"))) return;
    await api.del(`/api/pages/${id}`).catch(() => {});
    if (editId === id) resetForm();
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{t("Static Pages")}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editId ? t("Edit") : t("New page")}</h5>
              <form onSubmit={save}>
                <input className="form-control mb-2" placeholder={t("Title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}>
                  <option value={1}>{t("English")}</option>
                  <option value={2}>{t("Arabic")}</option>
                </select>
                <textarea className="form-control mb-2" rows={8} placeholder={t("Content (HTML allowed)")} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
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
                    <Link href={`/page/view?id=${p.id}`} className="text-decoration-none text-truncate">
                      {p.title}
                    </Link>
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

export default function AdminPagesPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
