"use client";

import { useCallback, useEffect, useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

const LANGUAGE_NAMES: Record<number, string> = {
  1: "العربية", 2: "English", 3: "中文", 4: "Español", 5: "हिन्दी", 6: "Français",
  7: "Русский", 8: "বাংলা", 9: "Português", 10: "اردو", 11: "Bahasa Indonesia",
};

const ALL_LANGUAGE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

interface Language { id: number; languageName: number; }

interface ExamVideo {
  id: number;
  languageId: number;
  videoUrl: string;
  playbackUrl?: string;
  title?: string | null;
  description?: string | null;
  updatedAt?: string | number | null;
}

/**
 * إدارة فيديو درس الفاتحة لكل لغة — يظهر للمتعلّم قبل الاختبار.
 * يقبل: يوتيوب · فيميو · أي منصّة (رابط) · أو رفع فيديو من الجهاز إلى R2.
 */
export function ExamVideoManager({ languages }: { languages: Language[] }) {
  const { t } = useI18n();
  const list: Language[] = languages.length
    ? languages
    : ALL_LANGUAGE_IDS.map((id) => ({ id, languageName: id }));

  const [videos, setVideos] = useState<ExamVideo[]>([]);
  const [videoLang, setVideoLang] = useState<number>(1);
  const [form, setForm] = useState({ videoUrl: "", title: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadVideos = useCallback(() => {
    api.get<ExamVideo[]>("/api/fatiha-exam/videos")
      .then((r) => setVideos(r.data ?? []))
      .catch(() => setVideos([]));
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  // تعبئة النموذج بفيديو اللغة المختارة (إن وُجد)
  useEffect(() => {
    const current = videos.find((v) => v.languageId === videoLang);
    setForm({
      videoUrl: current?.videoUrl ?? "",
      title: current?.title ?? "",
      description: current?.description ?? "",
    });
  }, [videoLang, videos]);

  const current = videos.find((v) => v.languageId === videoLang) ?? null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!form.videoUrl.trim()) {
      setErr(t("Video URL (YouTube, Vimeo, direct file, or any platform)"));
      return;
    }
    setBusy(true);
    try {
      await api.put(`/api/fatiha-exam/videos/${videoLang}`, {
        videoUrl: form.videoUrl.trim(),
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setMsg(t("Updated successfully"));
      loadVideos();
    } catch (e: any) {
      setErr(e?.result?.message || e?.message || t("Operation failed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`${t("Delete lesson video")}?`)) return;
    setBusy(true); setMsg(""); setErr("");
    try {
      await api.del(`/api/fatiha-exam/videos/${videoLang}`);
      setMsg(t("Deleted"));
      setForm({ videoUrl: "", title: "", description: "" });
      loadVideos();
    } catch (e: any) {
      setErr(e?.result?.message || e?.message || t("Delete failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fh-card mb-4 fh-video-admin">
      <div className="fh-card__head">
        <i className="fas fa-clapperboard"></i>
        <h3>{t("Lesson video per language")}</h3>
        <span className="badge bg-primary-subtle text-primary ms-auto">{videos.length}</span>
      </div>
      <div className="fh-card__body">
        <p className="fh-hint mt-0 mb-3">
          <i className="fas fa-circle-info me-1"></i>
          {t("The lesson appears to learners before the exam, in the language they select.")}
        </p>

        {msg && <div className="alert alert-success rounded-4 py-2"><i className="fas fa-check-circle me-2" />{msg}</div>}
        {err && <div className="alert alert-danger rounded-4 py-2"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        <form onSubmit={save}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="fh-label">{t("Language")}</label>
              <select className="form-select" value={videoLang} onChange={(e) => { setVideoLang(Number(e.target.value)); setMsg(""); setErr(""); }}>
                {list.map((l) => (
                  <option key={l.id} value={l.id}>{LANGUAGE_NAMES[l.languageName] ?? `#${l.languageName}`}</option>
                ))}
              </select>
            </div>

            <div className="col-md-8">
              <label className="fh-label">{t("Video URL (YouTube, Vimeo, direct file, or any platform)")}</label>
              <input
                className="form-control"
                dir="ltr"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </div>

            <div className="col-md-6">
              <label className="fh-label">{t("Video title (optional)")}</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("Fatiha Lesson")}
              />
            </div>

            <div className="col-md-6">
              <label className="fh-label">{t("Video description (optional)")}</label>
              <input
                className="form-control"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="col-12">
              <MediaPicker
                value={form.videoUrl}
                onChange={(url) => setForm((f) => ({ ...f, videoUrl: url }))}
                folder="exams"
                kind="video"
                label={t("Upload video from device")}
                placeholder="https://…"
                previewHeight={190}
              />
            </div>

            <div className="col-12 d-flex flex-wrap align-items-center gap-2">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="fas fa-floppy-disk" />}
                {t("Save lesson video")}
              </button>
              {current && (
                <button type="button" className="btn btn-outline-danger" onClick={remove} disabled={busy}>
                  <i className="fas fa-trash" />{t("Delete lesson video")}
                </button>
              )}
              {form.videoUrl && (
                <a className="btn btn-outline-secondary" href={form.videoUrl} target="_blank" rel="noreferrer">
                  <i className="fas fa-up-right-from-square" />{t("Watch")}
                </a>
              )}
              <span className="fh-hint ms-auto mb-0">
                <i className="fas fa-language me-1" />
                {LANGUAGE_NAMES[videoLang] ?? `#${videoLang}`}
                {current ? ` · ${t("Video")} ✓` : ` · ${t("No lesson video is available for this language yet.")}`}
              </span>
            </div>
          </div>
        </form>

        {videos.length > 0 && (
          <div className="fh-video-list">
            {videos
              .slice()
              .sort((a, b) => a.languageId - b.languageId)
              .map((v) => (
                <button
                  type="button"
                  key={v.id}
                  className={`fh-video-item${v.languageId === videoLang ? " is-active" : ""}`}
                  onClick={() => { setVideoLang(v.languageId); setMsg(""); setErr(""); }}
                >
                  <span className="fh-video-item__lang">
                    <i className="fas fa-language" />{LANGUAGE_NAMES[v.languageId] ?? `#${v.languageId}`}
                  </span>
                  <span className="fh-video-item__title" dir="ltr">{v.title || v.videoUrl}</span>
                  <i className="fas fa-chevron-left fh-video-item__arrow" aria-hidden="true" />
                </button>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}
