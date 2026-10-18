"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { parseVideoUrl } from "@/lib/video";

interface VideoLessonProps {
  /** رابط الفيديو (YouTube / Vimeo / ملف مباشر / أي منصّة). */
  url?: string | null;
  title?: string | null;
  description?: string | null;
  /** اسم اللغة المعروضة بجانب العنوان. */
  languageName?: string | null;
  /** هل هذا الفيديو بديل لأن لغة المتعلّم بلا فيديو؟ */
  isFallback?: boolean;
  /** عند تحديد «شاهدت الدرس». */
  onWatchedChange?: (watched: boolean) => void;
}

/**
 * درس الفيديو الذي يظهر للمتعلّم قبل الاختبار.
 * يدعم يوتيوب وفيميو والملفات المباشرة وأي رابط آخر يُضمَّن كإطار،
 * مع تصميم سينمائي متجاوب ومؤشر «شاهدت الدرس».
 */
export function VideoLesson({
  url,
  title,
  description,
  languageName,
  isFallback,
  onWatchedChange,
}: VideoLessonProps) {
  const { t } = useI18n();
  const parsed = parseVideoUrl(url);
  const [watched, setWatched] = useState(false);

  // إعادة الضبط عند تغيير الفيديو (تبديل اللغة مثلًا)
  useEffect(() => {
    setWatched(false);
    onWatchedChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!parsed) return null;

  return (
    <section className="fh-lesson" aria-label={title || t("Fatiha Lesson")}>
      <header className="fh-lesson__head">
        <span className="fh-lesson__badge" aria-hidden="true">
          <i className="fas fa-circle-play" />
        </span>
        <div className="fh-lesson__titles">
          <span className="fh-lesson__eyebrow">
            <i className="fas fa-graduation-cap" aria-hidden="true" />
            {t("Pre-exam lesson")}
          </span>
          <h3>{title || t("Fatiha Lesson")}</h3>
          <p>{description || t("Watch the lesson before starting the exam — it explains the meanings of Surah Al-Fatiha.")}</p>
        </div>
        {languageName && (
          <span className="fh-lesson__lang">
            <i className="fas fa-language" aria-hidden="true" />
            {languageName}
          </span>
        )}
      </header>

      <div className={`fh-lesson__screen${parsed.isFrame ? " fh-lesson__screen--frame" : ""}`}>
        {parsed.isFrame ? (
          <iframe
            src={parsed.src}
            title={title || t("Fatiha Lesson")}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video controls playsInline preload="metadata">
            <source src={parsed.src} />
            {t("Your browser does not support the video tag.")}
          </video>
        )}
      </div>

      <footer className="fh-lesson__foot">
        <a href={parsed.original} target="_blank" rel="noreferrer" className="fh-lesson__link">
          <i className="fas fa-up-right-from-square" aria-hidden="true" />
          {t("Open video in a new window")}
        </a>

        {isFallback && (
          <span className="fh-lesson__note">
            <i className="fas fa-circle-info" aria-hidden="true" />
            {t("A video for this language is not available yet — showing another available lesson.")}
          </span>
        )}

        <label className="fh-lesson__watched">
          <input
            type="checkbox"
            checked={watched}
            onChange={(e) => {
              setWatched(e.target.checked);
              onWatchedChange?.(e.target.checked);
            }}
          />
          <span>{t("I have watched the lesson")}</span>
        </label>
      </footer>
    </section>
  );
}
