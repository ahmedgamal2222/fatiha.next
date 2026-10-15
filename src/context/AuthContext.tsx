"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, setToken, getToken } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  nameAr?: string | null;
  nameEn?: string | null;
  mobile?: string | null;
  preferredCulture?: string;
  countryId?: number | null;
  jobCode?: string | null;
  profileImageUrl?: string | null;
  avatarUrl?: string | null;
  profileCompletionPercentage?: number;
  impersonating?: boolean;
}

interface AuthCtx {
  user: CurrentUser | null;
  loading: boolean;
  isAuthed: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { languages, setLang } = useI18n();

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<CurrentUser>("/api/auth/me");
      const me = res.data ?? null;
      setUser(me);
      // إن لم يختر المستخدم لغة على هذا الجهاز، نعتمد لغته المفضّلة من الملف الشخصي
      // حتى تكون إشعارات المنصة والبريد بنفس لغة الواجهة.
      if (
        me?.preferredCulture &&
        typeof window !== "undefined" &&
        !window.localStorage.getItem("fatiha_lang")
      ) {
        const two = me.preferredCulture.slice(0, 2).toLowerCase();
        const def = languages.find((l) => l.apiCode.slice(0, 2).toLowerCase() === two);
        if (def) setLang(def.code);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [languages, setLang]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string } & CurrentUser>("/api/auth/login", { email, password }, false);
    if (res.data?.token) setToken(res.data.token);
    await refresh();
  }, [refresh]);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    const res = await api.post<{ token: string } & CurrentUser>("/api/auth/register", payload, false);
    if (res.data?.token) setToken(res.data.token);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* تجاهل */
    }
    setToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isAuthed: !!user,
        isAdmin: user?.role === "Admin",
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
