"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

/**
 * إدارة التصنيفات (إضافة · تعديل · حذف) لأي قسم: الكتب · المدوّنة · المتجر.
 * تُستخدم داخل صفحات الإدارة، وتستدعي:
 *   POST   {base}/categories        إضافة
 *   PUT    {base}/categories/:id    تعديل
 *   DELETE {base}/categories/:id    حذف (يُرفض إن كان مرتبطاً بعناصر)
 */

export interface Category {
  id: number;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
}

interface Props {
  /** مسار القسم في الـ API: /api/books | /api/blogs | /api/marketplace */
  base: string;
  categories: Category[];
  /** يعيد تحميل القوائم في الصفحة الأب (التصنيفات + العناصر) */
  onChanged: () => void;
  /** تصنيفات الكتب باسمين (عربي/إنجليزي) */
  bilingual?: boolean;
}

export function CategoryManager({ base, categories, onChanged, bilingual = false }: Props) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function reset() {
    setName("");
    setNameAr("");
    setNameEn("");
    setEditId(null);
  }

  function startEdit(c: Category) {
    setEditId(c.id);
    setName(c.name ?? "");
    setNameAr(c.nameAr ?? "");
    setNameEn(c.nameEn ?? "");
    setMsg("");
    setErr("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const valueAr = nameAr.trim();
    const valueEn = nameEn.trim();
    const value = name.trim();
    if (bilingual ? !valueAr || !valueEn : !value) {
      setErr(t("Name is required"));
      return;
    }
    const body: { nameAr?: string; nameEn?: string; name?: string } = bilingual
      ? { nameAr: valueAr, nameEn: valueEn }
      : { name: value };
    setBusy(true);
    try {
      if (editId) {
        await api.put(`${base}/categories/${editId}`, body);
        setMsg(t("Updated successfully"));
      } else {
        await api.post(`${base}/categories`, body);
        setMsg(t("Created successfully"));
      }
      reset();
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Operation failed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(t("Delete this category?"))) return;
    setMsg("");
    setErr("");
    try {
      await api.del(`${base}/categories/${id}`);
      setMsg(t("Deleted"));
      if (editId === id) reset();
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("Delete failed"));
    }
  }

  return (
    <div className="card shadow-sm border-0 rounded-4 mb-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">
          <i className="fas fa-tags me-2 text-primary" />
          {t("Categories")}
          <span className="badge bg-primary-subtle text-primary ms-2">{categories.length}</span>
        </h6>

        {msg && <div className="alert alert-success py-1 px-2 small mb-2">{msg}</div>}
        {err && <div className="alert alert-danger py-1 px-2 small mb-2">{err}</div>}

        <form onSubmit={submit} className="d-flex flex-wrap gap-2 mb-3">
          {bilingual ? (
            <>
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 170 }}
                placeholder={t("Name (Arabic)")}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
              />
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 170 }}
                placeholder={t("Name (English)")}
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                dir="ltr"
              />
            </>
          ) : (
            <input
              className="form-control form-control-sm"
              style={{ maxWidth: 240 }}
              placeholder={t("Name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <button className="btn btn-sm btn-primary" disabled={busy}>
            {busy ? (
              <span className="spinner-border spinner-border-sm me-1" />
            ) : (
              <i className={`fas ${editId ? "fa-check" : "fa-plus"} me-1`} />
            )}
            {editId ? t("Update") : t("Add")}
          </button>
          {editId && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reset}>
              {t("Cancel")}
            </button>
          )}
        </form>

        <ul className="list-group list-group-flush">
          {categories.length === 0 ? (
            <li className="list-group-item px-0 small text-muted">{t("No data")}</li>
          ) : (
            categories.map((c) => (
              <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span className="text-truncate">
                  {bilingual ? (ar ? c.nameAr || c.nameEn : c.nameEn || c.nameAr) : c.name}
                </span>
                <span className="d-flex gap-1">
                  <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => startEdit(c)}>
                    <i className="fas fa-pen" />
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => remove(c.id)}>
                    <i className="fas fa-trash" />
                  </button>
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
