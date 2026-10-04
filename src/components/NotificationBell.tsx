"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

interface Noti {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: number;
}

function timeAgo(ts: number, ar: boolean): string {
  const d = new Date(typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return ar ? "الآن" : "now";
  if (m < 60) return ar ? `منذ ${m} د` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `منذ ${h} س` : `${h}h`;
  const days = Math.floor(h / 24);
  return ar ? `منذ ${days} ي` : `${days}d`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const loadCount = useCallback(() => {
    api.get<{ count: number }>("/api/notifications/unread-count")
      .then((r) => setCount(r.data?.count ?? 0)).catch(() => {});
  }, []);

  const loadItems = useCallback(() => {
    api.get<Noti[]>("/api/notifications?limit=20")
      .then((r) => setItems(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCount();
    const id = setInterval(loadCount, 30000);
    return () => clearInterval(id);
  }, [user, loadCount]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  }

  async function openNoti(n: Noti) {
    if (!n.isRead) {
      await api.post(`/api/notifications/${n.id}/read`).catch(() => {});
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    await api.post("/api/notifications/read-all").catch(() => {});
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setCount(0);
  }

  if (!user) return null;

  return (
    <div className="fh-bell" ref={ref}>
      <button className="fh-bell__btn nav-link" onClick={toggle} aria-label={t("Notifications")}>
        <i className="fas fa-bell"></i>
        {count > 0 && <span className="fh-bell__badge">{count > 99 ? "99+" : count}</span>}
      </button>
      {open && (
        <div className="fh-bell__menu">
          <div className="fh-bell__head">
            <h6>{t("Notifications")}</h6>
            {items.some((i) => !i.isRead) && (
              <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={markAll}>
                {t("Mark all as read")}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-muted small text-center py-4 mb-0"><i className="fas fa-bell-slash me-1" />{t("No notifications")}</p>
          ) : (
            items.map((n) => (
              <button key={n.id} className={`fh-noti ${n.isRead ? "" : "fh-noti--unread"} w-100 text-start border-0`}
                style={{ background: "transparent", cursor: "pointer" }} onClick={() => openNoti(n)}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <p className="fh-noti__title">{n.title}</p>
                  <span className="fh-noti__time">{timeAgo(n.createdAt, ar)}</span>
                </div>
                <p className="fh-noti__msg">{n.message}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
