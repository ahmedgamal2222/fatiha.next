"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Product {
  id: number;
  title: string;
  price: number;
  currencyCode?: string | null;
}
interface Category {
  id: number;
  name?: string;
  nameAr?: string;
  nameEn?: string;
}

function Inner() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: "", marketCategoryId: 0, price: 0, description: "", imageUrl: "", currencyCode: "USD" });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api.get<Product[]>("/api/marketplace", false).then((r) => setItems(r.data ?? [])).catch(() => {});
    api.get<Category[]>("/api/marketplace/categories", false).then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/marketplace", {
        ...form,
        price: Number(form.price),
        marketCategoryId: Number(form.marketCategoryId) || (cats[0]?.id ?? 1),
      });
      setForm({ title: "", marketCategoryId: 0, price: 0, description: "", imageUrl: "", currencyCode: "USD" });
      setMsg(ar ? "تمت الإضافة" : "Created");
      load();
    } catch {
      setMsg(ar ? "فشل الإنشاء" : "Create failed");
    }
  }
  async function remove(id: number) {
    if (!confirm(ar ? "حذف المنتج؟" : "Delete product?")) return;
    await api.del(`/api/marketplace/${id}`).catch(() => {});
    load();
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "إدارة المتجر" : "Manage Marketplace"}</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{ar ? "منتج جديد" : "New product"}</h5>
              <form onSubmit={create}>
                <input className="form-control mb-2" placeholder={ar ? "الاسم" : "Title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="form-select mb-2" value={form.marketCategoryId} onChange={(e) => setForm({ ...form, marketCategoryId: Number(e.target.value) })}>
                  <option value={0}>{ar ? "التصنيف" : "Category"}</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || (ar ? c.nameAr : c.nameEn)}</option>
                  ))}
                </select>
                <div className="input-group mb-2">
                  <input type="number" step="0.01" className="form-control" placeholder={ar ? "السعر" : "Price"} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
                  <input className="form-control" style={{ maxWidth: 90 }} value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase().slice(0, 3) })} />
                </div>
                <input className="form-control mb-2" placeholder={ar ? "رابط الصورة" : "Image URL"} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
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
                {items.map((p) => (
                  <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="text-truncate">
                      {p.title} — <span className="text-muted small">{p.price} {p.currencyCode || "USD"}</span>
                    </span>
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

export default function AdminMarketplacePage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
