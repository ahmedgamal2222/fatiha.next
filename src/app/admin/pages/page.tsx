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
}

function Inner() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<StaticPage[]>([]);
  const [form, setForm] = useState({ title: "", content: "", languageId: 2 });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get<StaticPage[]>("/api/pages", false).then((r) => setItems(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/pages", form);
      setForm({ title: "", content: "", languageId: 2 });
      setMsg(ar ? "تمت الإضافة" : "Created");
      load();
    } catch {
      setMsg(ar ? "فشل الإنشاء" : "Create failed");
    }
  }
  async function remove(id: number) {
    if (!confirm(ar ? "حذف الصفحة؟" : "Delete page?")) return;
    await api.del(`/api/pages/${id}`).catch(() => {});
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "الصفحات الثابتة" : "Static Pages"}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{ar ? "صفحة جديدة" : "New page"}</h5>
              <form onSubmit={create}>
                <input className="form-control mb-2" placeholder={ar ? "العنوان" : "Title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}>
                  <option value={1}>English</option>
                  <option value={2}>العربية</option>
                </select>
                <textarea className="form-control mb-2" rows={8} placeholder={ar ? "المحتوى (HTML مسموح)" : "Content (HTML allowed)"} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                <button className="btn btn-primary w-100">{ar ? "إضافة" : "Create"}</button>
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
                    <Link href={`/page/${p.id}`} className="text-decoration-none text-truncate">
                      {p.title}
                    </Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(p.id)}>
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

export default function AdminPagesPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
