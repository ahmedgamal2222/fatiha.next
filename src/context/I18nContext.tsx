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
  Language: { ar: "اللغة", en: "Language" },
  Close: { ar: "إغلاق", en: "Close" },
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
  "Main navigation": { ar: "التنقّل الرئيسي", en: "Main navigation" },
  "Fatiha journey": { ar: "مسار الفاتحة", en: "Fatiha journey" },
  "My Requests": { ar: "طلباتي", en: "My Requests" },
  "Fatiha Requests": { ar: "طلبات الفاتحة", en: "Fatiha Requests" },
  "Listen to the recitations": { ar: "استمع إلى القراءات", en: "Listen to the recitations" },
  "Join as an instructor": { ar: "انضم كمعلّم", en: "Join as an instructor" },
  "Certified instructors": { ar: "المعلّمون المُجازون", en: "Certified instructors" },
  Qiraat: { ar: "القراءات", en: "Qiraat" },
  "Fatiha Library": { ar: "مكتبة الفاتحة", en: "Fatiha Library" },
  "Control center": { ar: "مركز التحكّم", en: "Control center" },
  Dashboard: { ar: "لوحة المعلومات", en: "Dashboard" },
  "Account menu": { ar: "قائمة الحساب", en: "Account menu" },
  Menu: { ar: "القائمة", en: "Menu" },
  Navigate: { ar: "التنقّل", en: "Navigate" },
  "Quick links": { ar: "روابط سريعة", en: "Quick links" },
  "Start your journey": { ar: "ابدأ رحلتك", en: "Start your journey" },
  "Made with care for the Holy Quran": { ar: "صُنع بعناية لخدمة القرآن الكريم", en: "Made with care for the Holy Quran" },
  "Recite Surah Al-Fatiha with precision, understand its meanings, and earn a certified Ijazah from anywhere in the world.": {
    ar: "اتلُ سورة الفاتحة بإتقان، وافهم معانيها، واحصل على إجازة موثّقة من أي مكان في العالم.",
    en: "Recite Surah Al-Fatiha with precision, understand its meanings, and earn a certified Ijazah from anywhere in the world.",
  },
  "Listen to the Ten Qiraat": { ar: "استمع إلى القراءات العشر", en: "Listen to the Ten Qiraat" },
  "Certified Ijazah": { ar: "إجازة موثّقة", en: "Certified Ijazah" },
  Worldwide: { ar: "حول العالم", en: "Worldwide" },
  "Mother of the Book": { ar: "أمّ الكتاب", en: "Mother of the Book" },
  "The Opening of the Book — seven verses recited in every prayer.": {
    ar: "فاتحة الكتاب — سبع آيات تُقرأ في كل صلاة.",
    en: "The Opening of the Book — seven verses recited in every prayer.",
  },
  "Scroll down": { ar: "انزل للأسفل", en: "Scroll down" },
  "Platform statistics": { ar: "إحصاءات المنصة", en: "Platform statistics" },
  "A verse from the Holy Quran": { ar: "آية من القرآن الكريم", en: "A verse from the Holy Quran" },
  "Surah Al-Hijr — Verse 87": { ar: "سورة الحِجر — الآية ٨٧", en: "Surah Al-Hijr — Verse 87" },
  "How it works": { ar: "كيف تعمل المنصة", en: "How it works" },
  "Four steps to your Ijazah": { ar: "أربع خطوات إلى إجازتك", en: "Four steps to your Ijazah" },
  "A clear, guided path from your first visit to a verified certificate.": {
    ar: "مسار واضح ومُرشد من أول زيارة إلى شهادة موثّقة.",
    en: "A clear, guided path from your first visit to a verified certificate.",
  },
  "Choose your recitation": { ar: "اختر قراءتك", en: "Choose your recitation" },
  "Register in seconds and complete your profile in your own language.": {
    ar: "سجّل في ثوانٍ وأكمل ملفك الشخصي بلغتك.",
    en: "Register in seconds and complete your profile in your own language.",
  },
  "Listen to the ten Qiraat and select the narration you wish to be certified in.": {
    ar: "استمع إلى القراءات العشر واختر الرواية التي تريد الإجازة فيها.",
    en: "Listen to the ten Qiraat and select the narration you wish to be certified in.",
  },
  "Take the qualifying exam": { ar: "أدِّ الاختبار التأهيلي", en: "Take the qualifying exam" },
  "Watch the short lesson, then pass the five-question exam with 60% or more.": {
    ar: "شاهد الدرس القصير، ثم اجتز اختبار الأسئلة الخمسة بنسبة 60% أو أكثر.",
    en: "Watch the short lesson, then pass the five-question exam with 60% or more.",
  },
  "Receive your Ijazah": { ar: "استلم إجازتك", en: "Receive your Ijazah" },
  "Download your certified Ijazah with a unique ID that verifies your achievement.": {
    ar: "حمّل إجازتك الموثّقة برقم تعريف فريد يوثّق إنجازك.",
    en: "Download your certified Ijazah with a unique ID that verifies your achievement.",
  },
  "Start now": { ar: "ابدأ الآن", en: "Start now" },
  "Ten authenticated recitations, one clear goal: mastering Surah Al-Fatiha.": {
    ar: "عشر قراءات موثّقة، وهدف واحد واضح: إتقان سورة الفاتحة.",
    en: "Ten authenticated recitations, one clear goal: mastering Surah Al-Fatiha.",
  },
  "Everything you need to know before you begin your Fatiha journey.": {
    ar: "كل ما تحتاج معرفته قبل أن تبدأ رحلتك مع الفاتحة.",
    en: "Everything you need to know before you begin your Fatiha journey.",
  },
  "Your certificate is verifiable with a unique ID.": {
    ar: "شهادتك قابلة للتحقّق عبر رقم تعريف فريد.",
    en: "Your certificate is verifiable with a unique ID.",
  },
  "A global platform to recite Surah Al-Fatiha accurately, understand its meanings, and earn a certified Ijazah in one of the ten Qiraat.": {
    ar: "منصة عالمية لتلاوة سورة الفاتحة بإتقان، وفهم معانيها، والحصول على إجازة موثّقة في إحدى القراءات العشر.",
    en: "A global platform to recite Surah Al-Fatiha accurately, understand its meanings, and earn a certified Ijazah in one of the ten Qiraat.",
  },
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
