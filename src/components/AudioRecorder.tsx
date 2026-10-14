"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/context/I18nContext";

/**
 * مسجّل صوتي — مطابق لتجربة التسجيل في مشروع الفاتحة الأصلي:
 * زر بدء/إيقاف عبر الميكروفون + رفع ملف صوتي كبديل.
 * النتيجة تُسَلَّم عبر onResult(blob, objectUrl) ليرفعها المتصل.
 */

export interface AudioRecordResult {
  blob: Blob;
  url: string;
  name: string;
}

interface AudioRecorderProps {
  onResult: (r: AudioRecordResult) => void;
  onClear?: () => void;
  required?: boolean;
}

export function AudioRecorder({ onResult, onClear, required }: AudioRecorderProps) {
  const { t } = useI18n();
  const [isRecording, setRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [message, setMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recorderError, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("audio/webm");
  const audioUrlRef = useRef<string | null>(null);
  // الأحدث فقط: نتجنّب استدعاءات قديمة عند الضغط المتكرر
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const fileRef = useRef<HTMLInputElement | null>(null);

  // تنظيف عند الإزالة: إيقاف الميكروفون وتحرير أي رابط مؤقت
  useEffect(() => {
    const live = { mediaRecorderRef, streamRef, audioUrlRef };
    return () => {
      try { live.mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
      live.streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      if (live.audioUrlRef.current) { try { URL.revokeObjectURL(live.audioUrlRef.current); } catch { /* ignore */ } }
      live.mediaRecorderRef.current = null;
      live.streamRef.current = null;
      live.audioUrlRef.current = null;
    };
  }, []);

  const showMsg = useCallback((m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 2500);
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
    streamRef.current = null;
  }

  /** صيغة مدعومة فعلياً — Safari مثلاً لا يقبل webm. */
  function pickMime(): string {
    const MR = window.MediaRecorder as unknown as { isTypeSupported?: (t: string) => boolean } | undefined;
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
    for (const c of candidates) {
      try { if (MR?.isTypeSupported?.(c)) return c; } catch { /* ignore */ }
    }
    return "";
  }

  function extFor(mime: string): string {
    if (mime.includes("mp4")) return "m4a";
    if (mime.includes("mpeg")) return "mp3";
    if (mime.includes("ogg") || mime.includes("oga")) return "ogg";
    return "webm";
  }

  function setPreview(url: string | null) {
    if (audioUrlRef.current && audioUrlRef.current !== url) {
      try { URL.revokeObjectURL(audioUrlRef.current); } catch { /* ignore */ }
    }
    audioUrlRef.current = url;
    setAudioUrl(url);
  }

  const startRecording = useCallback(async () => {
    try {
      const nav = navigator as unknown as {
        mediaDevices?: { getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream> };
        getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>;
      };
      const getUserMedia =
        nav.mediaDevices?.getUserMedia?.bind(nav.mediaDevices) ??
        (typeof nav.getUserMedia === "function" ? nav.getUserMedia.bind(nav) : null);
      if (!getUserMedia) {
        if (!window.isSecureContext) {
          setError(t("Microphone requires a secure connection (HTTPS) or localhost — upload an audio file instead."));
        } else {
          setError(t("Microphone is not supported in this browser — upload an audio file instead."));
        }
        fileRef.current?.click();
        return;
      }
      const stream = await getUserMedia({ audio: true });
      const mime = pickMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mimeRef.current = recorder.mimeType || mime || "audio/webm";
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const type = mimeRef.current || "audio/webm";
          const blob = new Blob(chunksRef.current, { type });
          const url = URL.createObjectURL(blob);
          setPreview(url);
          setHasRecorded(true);
          onResultRef.current({ blob, url, name: `recording-${Date.now()}.${extFor(type)}` });
        } else {
          setError(t("No audio was captured — please try again."));
          setRecording(false);
        }
        stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        streamRef.current = null;
        showMsg(t("Recording stopped..."));
      };
      recorder.onerror = () => {
        setError(t("Recording failed — try uploading an audio file."));
        setRecording(false);
        stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
      setRecording(true);
      setError(null);
      showMsg(t("Recording started..."));
    } catch {
      if (!window.isSecureContext) {
        setError(t("Microphone requires a secure connection (HTTPS) or localhost — upload an audio file instead."));
      } else {
        setError(t("Microphone access was denied — try uploading an audio file."));
      }
    }
  }, [showMsg, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      setRecording(false);
    }
  }, [isRecording]);

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      setHasRecorded(true);
      setRecording(false);
      setError(null);
      onResultRef.current({ blob: file, url, name: file.name || "audio.wav" });
    },
    []
  );

  return (
    <div className="form-group fh-recorder">
      <label className="fh-label">
        <i className="fas fa-microphone-lines me-2 text-primary"></i>
        {t("Audio recording")}{required ? <span className="req"> *</span> : ""}
      </label>
      <div className="audio-record">
        {!isRecording ? (
          <button
            id="recordButton"
            type="button"
            onClick={startRecording}
            disabled={isRecording}
          >
            <i className={`fa-solid ${hasRecorded ? "fa-rotate-right" : "fa-microphone"}`}></i>
            {hasRecorded ? t("Redo Recording") : t("Start Recording")}
          </button>
        ) : (
          <button
            id="stopButton"
            type="button"
            className="inactive button-animate"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            <i className="fa-solid fa-stop"></i>
            {t("Stop Recording")}
          </button>
        )}

        <button
          type="button"
          className="fh-recorder__upload"
          onClick={() => fileRef.current?.click()}
        >
          <i className="fa-solid fa-file-audio"></i>
          {hasRecorded ? t("Upload an audio file instead") : t("Or upload an audio file")}
        </button>
      </div>

      {message && <div className="recording-message">{message}</div>}
      {recorderError && <div className="alert alert-danger mt-2 rounded-4">{recorderError}</div>}

      {audioUrl && (
        <div className="fh-media-box mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="fh-label mb-0"><i className="fas fa-headphones me-1"></i>{t("Preview")}</label>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                setAudioUrl(null);
                setHasRecorded(false);
                if (fileRef.current) fileRef.current.value = "";
                onClear?.();
              }}
            >
              <i className="fas fa-trash me-1"></i>{t("Remove recording")}
            </button>
          </div>
          <audio src={audioUrl} controls className="w-100" />
        </div>
      )}

      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFileSelected} style={{ display: "none" }} />
    </div>
  );
}