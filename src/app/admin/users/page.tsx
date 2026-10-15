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
  const { t } = useI18n();
  const { refresh } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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
  /** تعطيل/تفعيل الحساب — التعطيل يُبطل جلسات المستخدم فوراً فلا يستطيع الدخول بأي طريقة. */
  async function setStatus(id: string, isDeleted: boolean) {
    const question = isDeleted ? t("Disable this user?") : t("Enable this user?");
    if (!confirm(question)) return;
    setMsg("");
    setErr("");
    try {
      await api.patch(`/api/account/admin/users/${id}/status`, { isDeleted });
      setMsg(t("Account status updated"));
      load(q);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Operation failed"));
    }
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
      <h2 className="fw-bold text-primary mb-4">{t("Manage Users")}</h2>
      <div className="input-group mb-4" style={{ maxWidth: 420 }}>
        <input
          className="form-control"
          placeholder={t("Search by email or name")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && load(q)}
        />
        <button className="btn btn-primary" onClick={() => load(q)}>
          {t("Search")}
        </button>
      </div>

      {msg && <div className="alert alert-success rounded-4">{msg}</div>}
      {err && <div className="alert alert-danger rounded-4">{err}</div>}

      {loading ? (
        <p className="text-muted">{t("Loading...")}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white rounded-4 overflow-hidden shadow-sm">
            <thead className="table-light">
              <tr>
                <th>{t("User")}</th>
                <th>{t("Email")}</th>
                <th>{t("Role")}</th>
                <th>{t("Status")}</th>
                <th className="text-end">{t("Actions")}</th>
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
                          {t(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.isDeleted ? "bg-secondary" : "bg-success"}`}>
                      {u.isDeleted ? t("Disabled") : t("Active")}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => impersonate(u.id)} title={t("Impersonate")}>
                      <i className="fas fa-user-secret"></i>
                    </button>
                    {u.isDeleted ? (
                      <button className="btn btn-sm btn-outline-success" onClick={() => setStatus(u.id, false)} title={t("Enable")}>
                        <i className="fas fa-user-check me-1"></i>
                        {t("Enable")}
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(u.id, true)} title={t("Disable this user?")}>
                        <i className="fas fa-ban"></i>
                      </button>
                    )}
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
