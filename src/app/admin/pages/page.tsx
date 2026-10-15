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
  slug?: string | null;
  isPublished?: boolean;
  updatedAt?: number | string | null;
}

function Inner() {
  const { t } = useI18n();
  const [items, setItems] = useState<StaticPage[]>([]);
  const [form, setForm] = useState({ title: "", content: "", languageId: 2 });
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get<StaticPage[]>("/api/pages").then((r) => setItems(r.data ?? [])).catch(() => {});
  }, []);

  /** ينشئ صفحة فارغة ثم يفتح محرّر الصفحات المرئي عليها. */
  async function openBuilder() {
    setCreating(true);
    setMsg("");
    try {
      const r = await api.post<StaticPage>("/api/pages", {
        title: t("New page"),
        content: t("New page"),
        languageId: 1,
        isPublished: false,
      });
      if (r.data?.id) {
        window.location.href = `/admin/pages/builder?id=${r.data.id}`;
        return;
      }
      setMsg(t("Operation failed"));
    } catch {
      setMsg(t("Operation failed"));
    } finally {
      setCreating(false);
    }
  }

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
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <h2 className="fw-bold text-primary mb-0">{t("Static Pages")}</h2>
        <button className="btn btn-primary" onClick={openBuilder} disabled={creating}>
          {creating ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-layer-group me-2" />}
          {t("Page builder")}
        </button>
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}
      <p className="text-muted small">{t("Build pages visually with blocks")}</p>
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
                  <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center px-0 gap-2">
                    <div className="text-truncate">
                      <Link href={`/page/view?id=${p.id}`} className="text-decoration-none fw-semibold">
                        {p.title}
                      </Link>
                      <div className="small text-muted" dir="ltr">
                        {p.slug ? `/${p.slug}` : `#${p.id}`}
                      </div>
                    </div>
                    <span className="d-flex gap-2 align-items-center flex-shrink-0">
                      <span className={`badge ${p.isPublished ? "bg-success" : "bg-secondary"}`}>
                        {p.isPublished ? t("Published") : t("Draft")}
                      </span>
                      <Link href={`/admin/pages/builder?id=${p.id}`} className="btn btn-sm btn-primary" title={t("Page builder")}>
                        <i className="fas fa-layer-group" />
                      </Link>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(p)} title={t("Edit")}>
                        <i className="fas fa-pen"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(p.id)} title={t("Delete")}>
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
