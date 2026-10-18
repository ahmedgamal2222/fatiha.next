"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// اللغات المدعومة (مطابقة لمشروع الفاتحة الأصلي)
export interface LangDef {
  code: Lang;
  apiCode: string; // الرمز المُرسَل لواجهة الترجمة
  name: string;
  dir: "rtl" | "ltr";
}

export type Lang = "ar" | "en" | "zh" | "es" | "hi" | "fr" | "ru" | "bn" | "pt" | "ur" | "id";

export const LANGUAGES: LangDef[] = [
  { code: "ar", apiCode: "ar-SA", name: "العربية", dir: "rtl" },
  { code: "en", apiCode: "en-US", name: "English", dir: "ltr" },
  { code: "zh", apiCode: "zh-CN", name: "中文", dir: "ltr" },
  { code: "es", apiCode: "es-ES", name: "Español", dir: "ltr" },
  { code: "hi", apiCode: "hi-IN", name: "हिन्दी", dir: "ltr" },
  { code: "fr", apiCode: "fr-FR", name: "Français", dir: "ltr" },
  { code: "ru", apiCode: "ru-RU", name: "Русский", dir: "ltr" },
  { code: "bn", apiCode: "bn-BD", name: "বাংলা", dir: "ltr" },
  { code: "pt", apiCode: "pt-BR", name: "Português", dir: "ltr" },
  { code: "ur", apiCode: "ur-PK", name: "اردو", dir: "rtl" },
  { code: "id", apiCode: "id-ID", name: "Bahasa Indonesia", dir: "ltr" },
];

// واجهة الترجمة عبر الـ API الجديد (نفس بنية مسار المشروع الأصلي)
const API_BASE =  "https://fatiha-api.info1703.workers.dev";
const TRANSLATION_API = `${API_BASE}/api/Language/GetTranslation`;

// احتياطي محلي لبعض المفاتيح الأساسية عند تعذّر تحميل الترجمة
const FALLBACK: Record<string, Partial<Record<Lang, string>>> = {
  Home: { ar: "الرئيسة", en: "Home" },
  "Log in": { ar: "تسجيل الدخول", en: "Log in" },
  Register: { ar: "إنشاء حساب", en: "Register" },
  "Log out": { ar: "تسجيل الخروج", en: "Log out" },
  profile: { ar: "الملف الشخصي", en: "Profile" },
  Languages: { ar: "اللغات", en: "Languages" },
  Settings: { ar: "الإعدادات", en: "Settings" },
  Fathia: { ar: "الفاتحة", en: "Fatiha" },
  MJAZ: { ar: "المُجاز", en: "MJAZ" },
  "Fatiha Lesson": { ar: "درس الفاتحة", en: "Fatiha Lesson" },
  "Pre-exam lesson": { ar: "درس ما قبل الاختبار", en: "Pre-exam lesson" },
  "I have watched the lesson": { ar: "شاهدت الدرس", en: "I have watched the lesson" },
  "Listen to the selected recitation": { ar: "استمع إلى القراءة المختارة", en: "Listen to the selected recitation" },
  "Listen to the recitation": { ar: "استمع إلى القراءة", en: "Listen to the recitation" },
  "Listen to the recitation before recording your own.": {
    ar: "استمع إلى التلاوة قبل تسجيل تلاوتك.",
    en: "Listen to the recitation before recording your own.",
  },
  "No audio is available for this recitation.": {
    ar: "لا يوجد ملف صوتي متاح لهذه القراءة.",
    en: "No audio is available for this recitation.",
  },
  "No lesson video is available for this language yet.": {
    ar: "لا يوجد فيديو درس متاح لهذه اللغة بعد.",
    en: "No lesson video is available for this language yet.",
  },
  "A video for this language is not available yet — showing another available lesson.": {
    ar: "لا يوجد فيديو لهذه اللغة بعد — يُعرض درس آخر متاح.",
    en: "A video for this language is not available yet — showing another available lesson.",
  },
  "Open video in a new window": { ar: "فتح الفيديو في نافذة جديدة", en: "Open video in a new window" },
  "Your browser does not support the video tag.": {
    ar: "متصفحك لا يدعم تشغيل الفيديو.",
    en: "Your browser does not support the video tag.",
  },
  "Watch the lesson before starting the exam — it explains the meanings of Surah Al-Fatiha.": {
    ar: "شاهد الدرس قبل بدء الاختبار — يشرح معاني سورة الفاتحة.",
    en: "Watch the lesson before starting the exam — it explains the meanings of Surah Al-Fatiha.",
  },
  "Lesson video per language": { ar: "فيديو الدرس حسب اللغة", en: "Lesson video per language" },
  "Save lesson video": { ar: "حفظ فيديو الدرس", en: "Save lesson video" },
  "Delete lesson video": { ar: "حذف فيديو الدرس", en: "Delete lesson video" },
  "Upload video from device": { ar: "رفع فيديو من الجهاز", en: "Upload video from device" },
  "Video title (optional)": { ar: "عنوان الفيديو (اختياري)", en: "Video title (optional)" },
  "Video description (optional)": { ar: "وصف الفيديو (اختياري)", en: "Video description (optional)" },
  "Video URL (YouTube, Vimeo, direct file, or any platform)": {
    ar: "رابط الفيديو (يوتيوب، فيميو، ملف مباشر، أو أي منصّة)",
    en: "Video URL (YouTube, Vimeo, direct file, or any platform)",
  },
  "The lesson appears to learners before the exam, in the language they select.": {
    ar: "يظهر الدرس للمتعلّمين قبل الاختبار، باللغة التي يختارونها.",
    en: "The lesson appears to learners before the exam, in the language they select.",
  },
  "Now playing": { ar: "يُشغَّل الآن", en: "Now playing" },
  Play: { ar: "تشغيل", en: "Play" },
  Pause: { ar: "إيقاف مؤقت", en: "Pause" },
  Mute: { ar: "كتم الصوت", en: "Mute" },
  Unmute: { ar: "إلغاء الكتم", en: "Unmute" },
  Volume: { ar: "مستوى الصوت", en: "Volume" },
  "Playback speed": { ar: "سرعة التشغيل", en: "Playback speed" },
  Repeat: { ar: "تكرار", en: "Repeat" },
  "Audio player": { ar: "مشغّل الصوت", en: "Audio player" },
  Watch: { ar: "مشاهدة", en: "Watch" },
  Video: { ar: "فيديو", en: "Video" },
};

interface I18nCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  languages: LangDef[];
  t: (key: string) => string;
  setLang: (l: Lang) => void;
  toggle: () => void;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const Ctx = createContext<I18nCtx | null>(null);

const translationCache: Partial<Record<Lang, Record<string, string>>> = {};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [dict, setDict] = useState<Record<string, string>>({});
  const [isLanguageModalOpen, setModal] = useState(false);

  const def = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const loadTranslations = useCallback(async (l: Lang) => {
    if (translationCache[l]) {
      setDict(translationCache[l]!);
      return;
    }
    const d = LANGUAGES.find((x) => x.code === l) ?? LANGUAGES[0];
    try {
      const res = await fetch(`${TRANSLATION_API}/${d.apiCode}`);
      const raw = (await res.json()) as Record<string, unknown>;
      // الاستجابة متداخلة: { "Section": { "Home": "الرئيسية", ... }, ... } — نُسطّحها لقاموس مفاتيح مباشر
      const flat: Record<string, string> = {};
      if (raw && typeof raw === "object") {
        for (const value of Object.values(raw)) {
          if (value && typeof value === "object") {
            for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
              if (typeof v === "string") flat[k] = v;
            }
          } else if (typeof value === "string") {
            // مفتاح مسطّح مباشر (نادر) — نستخدم اسمه كما هو غير متاح، نتجاهله
          }
        }
      }
      translationCache[l] = flat;
      setDict(flat);
    } catch {
      setDict({});
    }
  }, []);

  const applyDir = useCallback((l: Lang) => {
    const d = LANGUAGES.find((x) => x.code === l) ?? LANGUAGES[0];
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
      document.documentElement.dir = d.dir;
    }
  }, []);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("fatiha_lang")) as Lang | null;
    const initial = saved && LANGUAGES.some((l) => l.code === saved) ? saved : "ar";
    setLangState(initial);
    applyDir(initial);
    loadTranslations(initial);
  }, [applyDir, loadTranslations]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (typeof window !== "undefined") window.localStorage.setItem("fatiha_lang", l);
      applyDir(l);
      loadTranslations(l);
      setModal(false);
    },
    [applyDir, loadTranslations]
  );

  const toggle = useCallback(() => setLang(lang === "ar" ? "en" : "ar"), [lang, setLang]);

  const t = useCallback((key: string) => {
    // ضمان التسمية المطلوبة للصفحة الرئيسة حتى مع قاموس خادم قديم
    if (key === "Home" && lang === "ar") return "الرئيسة";
    return dict[key] ?? FALLBACK[key]?.[lang] ?? key;
  }, [dict, lang]);

  return (
    <Ctx.Provider
      value={{
        lang,
        dir: def.dir,
        languages: LANGUAGES,
        t,
        setLang,
        toggle,
        isLanguageModalOpen,
        openLanguageModal: () => setModal(true),
        closeLanguageModal: () => setModal(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
