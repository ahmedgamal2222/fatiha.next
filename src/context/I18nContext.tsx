"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

// قاموس الترجمة — أضف المفاتيح حسب الحاجة
const DICT: Dict = {
  app_name: { ar: "منصة الفاتحة", en: "Fatiha Platform" },
  home: { ar: "الرئيسية", en: "Home" },
  login: { ar: "تسجيل الدخول", en: "Login" },
  register: { ar: "إنشاء حساب", en: "Register" },
  logout: { ar: "تسجيل الخروج", en: "Logout" },
  profile: { ar: "الملف الشخصي", en: "Profile" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  name_ar: { ar: "الاسم بالعربية", en: "Name (Arabic)" },
  name_en: { ar: "الاسم بالإنجليزية", en: "Name (English)" },
  mobile: { ar: "الجوال", en: "Mobile" },
  fatiha_requests: { ar: "طلبات الفاتحة", en: "Fatiha Requests" },
  blogs: { ar: "المدوّنة", en: "Blog" },
  books: { ar: "المكتبة", en: "Library" },
  marketplace: { ar: "المتجر", en: "Marketplace" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  al_qerat: { ar: "القراءات", en: "Recitations" },
  points: { ar: "النقاط", en: "Points" },
  save: { ar: "حفظ", en: "Save" },
  submit: { ar: "إرسال", en: "Submit" },
  loading: { ar: "جارٍ التحميل...", en: "Loading..." },
  no_data: { ar: "لا توجد بيانات", en: "No data" },
  search: { ar: "بحث", en: "Search" },
  welcome: { ar: "مرحباً بك في منصة الفاتحة", en: "Welcome to the Fatiha Platform" },
  welcome_sub: {
    ar: "منصة لإجازة تلاوة سورة الفاتحة، مع القراءات والمكتبة والمدوّنة والمتجر.",
    en: "A platform for Al-Fatiha recitation certification — with recitations, library, blog and marketplace.",
  },
};

interface I18nCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof DICT | string) => string;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("fatiha_lang")) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fatiha_lang", l);
      document.documentElement.lang = l;
      document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const toggle = useCallback(() => setLang(lang === "ar" ? "en" : "ar"), [lang, setLang]);

  const t = useCallback(
    (key: string) => {
      const entry = DICT[key];
      return entry ? entry[lang] : key;
    },
    [lang]
  );

  return (
    <Ctx.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t, setLang, toggle }}>{children}</Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
