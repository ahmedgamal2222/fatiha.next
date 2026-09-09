"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  nameAr?: string | null;
  nameEn?: string | null;
  isDeleted: boolean;
  profileImageUrl?: string | null;
}

const ROLES = ["User", "Admin", "Authorized"];

function UsersInner() {
  const { lang } = useI18n();
  const { refresh } = useAuth();
  const ar = lang === "ar";
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback((search = "") => {
    setLoading(true);
    api
      .get<AdminUser[]>(`/api/account/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`)
      .then((r) => setUsers(r.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(id: string, role: string) {
    await api.put(`/api/account/admin/users/${id}/role`, { role }).catch(() => {});
    load(q);
  }
  async function remove(id: string) {
    if (!confirm(ar ? "تعطيل هذا المستخدم؟" : "Disable this user?")) return;
    await api.del(`/api/account/admin/users/${id}`).catch(() => {});
    load(q);
  }
  async function impersonate(id: string) {
    const r = await api.post<{ token: string }>(`/api/account/admin/users/${id}/impersonate`).catch(() => null);
    if (r?.data?.token) {
      setToken(r.data.token);
      await refresh();
      window.location.href = "/";
    }
  }

  return (
    <div className="container py-5 min-vh-100 bg-light">
      <h2 className="fw-bold text-primary mb-4">{ar ? "إدارة المستخدمين" : "Manage Users"}</h2>
      <div className="input-group mb-4" style={{ maxWidth: 420 }}>
        <input
          className="form-control"
          placeholder={ar ? "بحث بالبريد أو الاسم" : "Search by email or name"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && load(q)}
        />
        <button className="btn btn-primary" onClick={() => load(q)}>
          {ar ? "بحث" : "Search"}
        </button>
      </div>

      {loading ? (
        <p className="text-muted">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white rounded-4 overflow-hidden shadow-sm">
            <thead className="table-light">
              <tr>
                <th>{ar ? "المستخدم" : "User"}</th>
                <th>{ar ? "البريد" : "Email"}</th>
                <th>{ar ? "الدور" : "Role"}</th>
                <th className="text-end">{ar ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.isDeleted ? "opacity-50" : ""}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.profileImageUrl || "https://placehold.co/36x36?text=?"} alt="" width={36} height={36} className="rounded-circle" style={{ objectFit: "cover" }} />
                      <span>{u.nameAr || u.nameEn || "—"}</span>
                    </div>
                  </td>
                  <td className="small text-muted">{u.email}</td>
                  <td>
                    <select className="form-select form-select-sm" style={{ width: 130 }} value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => impersonate(u.id)} title={ar ? "دخول كالمستخدم" : "Impersonate"}>
                      <i className="fas fa-user-secret"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u.id)}>
                      <i className="fas fa-ban"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <UsersInner />
    </AdminGuard>
  );
}
