"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n, type Lang } from "@/context/I18nContext";
import { VideoLesson } from "@/components/VideoLesson";

interface Question {
  id: number;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  explanationVideoUrl?: string | null;
  languageId: number;
}
interface Language { id: number; languageName: number; }
interface LessonVideo {
  id: number;
  languageId: number;
  title?: string | null;
  description?: string | null;
  videoUrl: string;
  playbackUrl: string;
  updatedAt?: string | number | null;
}
interface LessonVideoResponse {
  video: LessonVideo | null;
  requestedLanguageId: number | null;
  languageId: number | null;
  isFallback: boolean;
}
interface ExamResult {
  correct: number;
  total: number;
  percentage: number;
  passed: boolean;
  passThreshold: number;
  qualifiedRequestIds: number[];
}

const LANGUAGE_NAMES: Record<number, string> = {
  1: "العربية", 2: "English", 3: "中文", 4: "Español", 5: "हिन्दी", 6: "Français",
  7: "Русский", 8: "বাংলা", 9: "Português", 10: "اردو", 11: "Bahasa Indonesia",
};

/** ربط لغة الواجهة بمعرّف اللغة في قاعدة البيانات (EnumCommon.Languagelist). */
const LANG_TO_ID: Record<Lang, number> = {
  ar: 1, en: 2, zh: 3, es: 4, hi: 5, fr: 6, ru: 7, bn: 8, pt: 9, ur: 10, id: 11,
};

const ALL_LANGUAGES: Language[] = Object.keys(LANGUAGE_NAMES).map((id) => ({
  id: Number(id),
  languageName: Number(id),
}));

function ExamContent() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const requestId = search.get("requestId") ? Number(search.get("requestId")) : null;

  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageId, setLanguageId] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"select" | "test" | "result">("select");
  const [result, setResult] = useState<ExamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // فيديو شرح معاني سورة الفاتحة — يُعرض قبل الاختبار بلغة المتعلّم
  const [video, setVideo] = useState<LessonVideo | null>(null);
  const [videoFallback, setVideoFallback] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    api.get<Language[]>("/api/reference/languages", false)
      .then((r) => {
        const list = (r.data && r.data.length > 0) ? r.data : ALL_LANGUAGES;
        setLanguages(list);
        // اختيار لغة الامتحان تلقائياً بحسب لغة الواجهة الحالية
        const preferred = LANG_TO_ID[lang] ?? 1;
        setLanguageId((current) => {
          if (current) return current;
          return list.some((l) => l.id === preferred) ? preferred : list[0]?.id ?? 0;
        });
      })
      .catch(() => setLanguages(ALL_LANGUAGES));
  }, [user, loading, router, lang]);

  // جلب فيديو الدرس المناسب للغة المختارة (مع بديل تلقائي إن لم يوجد)
  useEffect(() => {
    if (!languageId) { setVideo(null); setVideoFallback(false); return; }
    let cancelled = false;
    setVideoLoading(true);
    api.get<LessonVideoResponse>(`/api/fatiha-exam/video?languageId=${languageId}`, false)
      .then((r) => {
        if (cancelled) return;
        setVideo(r.data?.video ?? null);
        setVideoFallback(!!r.data?.isFallback);
      })
      .catch(() => { if (!cancelled) { setVideo(null); setVideoFallback(false); } })
      .finally(() => { if (!cancelled) setVideoLoading(false); });
    return () => { cancelled = true; };
  }, [languageId]);

  async function startExam() {
    if (!languageId) { setErr(t("Please choose a language")); return; }
    setBusy(true); setErr("");
    try {
      const q = requestId ? `?languageId=${languageId}&fatihaRequestId=${requestId}` : `?languageId=${languageId}`;
      const res = await api.get<{ questions: Question[] }>(`/api/fatiha-exam/start${q}`);
      const qs = res.data?.questions ?? [];
      if (qs.length === 0) { setErr(t("No exam questions available for this language yet.")); setBusy(false); return; }
      setQuestions(qs);
      setAnswers({});
      setPhase("test");
    } catch { setErr(t("Operation failed")); }
    finally { setBusy(false); }
  }

  async function submitExam() {
    if (Object.keys(answers).length < questions.length) { setErr(t("Please answer all questions")); return; }
    setBusy(true); setErr("");
    try {
      const payload = {
        answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] })),
        fatihaRequestId: requestId,
      };
      const res = await api.post<ExamResult>("/api/fatiha-exam/submit", payload);
      setResult(res.data ?? null);
      setPhase("result");
    } catch { setErr(t("Operation failed")); }
    finally { setBusy(false); }
  }

  const options = (q: Question) => [q.answer1, q.answer2, q.answer3, q.answer4];

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-graduation-cap"></i></span>
          <h1 className="fh-page__title">{t("Fatiha Qualifying Exam")}</h1>
          <p className="fh-page__subtitle">{t("Answer the questions correctly to qualify your Fatiha request and earn your certificate.")}</p>
        </div>
      </header>

      <div className="fh-container" style={{ maxWidth: 760 }}>
        {err && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        {phase === "select" && (
          <div className="fh-card">
            <div className="fh-card__head"><i className="fas fa-language"></i><h3>{t("Choose Exam Language")}</h3></div>
            <div className="fh-card__body">
              <label className="fh-label">{t("Language")}</label>
              <select className="form-select mb-3" value={languageId} onChange={(e) => setLanguageId(Number(e.target.value))}>
                <option value={0} disabled>{t("Select...")}</option>
                {languages.map((l) => (<option key={l.id} value={l.id}>{LANGUAGE_NAMES[l.languageName] ?? `#${l.languageName}`}</option>))}
              </select>
              <div className="fh-hint mb-3">
                <i className="fas fa-circle-info me-1"></i>
                {t("The exam consists of 5 questions. You need 60% or more to pass.")}
              </div>

              {/* درس الفيديو — يظهر باللغة المختارة قبل بدء الاختبار */}
              {videoLoading ? (
                <div className="fh-lesson-skeleton">
                  <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
                  <span>{t("Loading...")}</span>
                </div>
              ) : video ? (
                <VideoLesson
                  url={video.playbackUrl || video.videoUrl}
                  title={video.title}
                  description={video.description}
                  languageName={LANGUAGE_NAMES[video.languageId] ?? null}
                  isFallback={videoFallback}
                />
              ) : (
                <div className="fh-lesson-empty">
                  <i className="fas fa-film" aria-hidden="true" />
                  <p>{t("No lesson video is available for this language yet.")}</p>
                </div>
              )}

              <button className="btn btn-primary" onClick={startExam} disabled={busy}>
                {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-play me-2" />}
                {t("Start Exam")}
              </button>
            </div>
          </div>
        )}

        {phase === "test" && (
          <div className="fh-card">
            <div className="fh-card__head"><i className="fas fa-list-ol"></i><h3>{t("Exam Questions")}</h3>
              <span className="badge bg-primary-subtle text-primary ms-auto">{Object.keys(answers).length}/{questions.length}</span>
            </div>
            <div className="fh-card__body">
              {questions.map((q, idx) => (
                <div key={q.id} className="fh-exam-q">
                  <div className="fh-exam-q__title">
                    <span className="fh-exam-q__num">{idx + 1}</span>
                    <span>{q.question}</span>
                  </div>
                  {options(q).map((opt, i) => {
                    const val = i + 1;
                    const selected = answers[q.id] === val;
                    return (
                      <label key={i} className={`fh-exam-opt ${selected ? "fh-exam-opt--selected" : ""}`}>
                        <input type="radio" name={`q-${q.id}`} checked={selected}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: val }))} />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
              <button className="btn btn-primary w-100 mt-2" onClick={submitExam} disabled={busy}>
                {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-2" />}
                {t("Submit Exam")}
              </button>
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <div className="fh-card">
            <div className="fh-card__body text-center py-5">
              <div style={{ fontSize: "3.4rem" }} className={result.passed ? "text-success" : "text-danger"}>
                <i className={`fas ${result.passed ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
              </div>
              <h3 className="fw-bold mt-3">{result.passed ? t("Congratulations! You passed") : t("You did not pass this time")}</h3>
              <div className="display-5 fw-bold text-primary my-2">{result.percentage}%</div>
              <p className="text-muted">{t("Correct answers")}: {result.correct}/{result.total}</p>
              {result.passed ? (
                <p className="text-success">
                  <i className="fas fa-award me-1"></i>
                  {t("Your request has been qualified and your certificate is now available.")}
                </p>
              ) : (
                <p className="text-muted">{t("You need {n}% to pass. Review and try again.").replace("{n}", String(result.passThreshold))}</p>
              )}
              <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
                {result.passed ? (
                  <Link href="/profile" className="btn btn-success"><i className="fas fa-certificate me-1"></i>{t("View Certificates")}</Link>
                ) : (
                  <button className="btn btn-primary" onClick={() => { setPhase("select"); setResult(null); }}>
                    <i className="fas fa-rotate-right me-1"></i>{t("Try Again")}
                  </button>
                )}
                <Link href="/fatiha-requests" className="btn btn-outline-secondary">{t("Back to My Requests")}</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FatihaExamPage() {
  return (
    <Suspense fallback={<div className="container py-5 min-vh-100" />}>
      <ExamContent />
    </Suspense>
  );
}
