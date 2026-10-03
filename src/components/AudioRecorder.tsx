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
  const fileRef = useRef<HTMLInputElement | null>(null);

  // تنظيف عند الإزالة
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const showMsg = useCallback((m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 2500);
  }, []);

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
        setError(t("Microphone is not supported in this browser — upload an audio file instead."));
        return;
      }
      const stream = await getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "audio/wav" });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setHasRecorded(true);
          onResult({ blob, url, name: `recording-${Date.now()}.wav` });
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        showMsg(t("Recording stopped..."));
      };
      recorder.onerror = () => {
        setError(t("Recording failed — try uploading an audio file."));
        setRecording(false);
      };
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
      setRecording(true);
      setError(null);
      showMsg(t("Recording started..."));
    } catch {
      setError(t("Microphone access was denied — try uploading an audio file."));
    }
  }, [onResult, showMsg, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [isRecording]);

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setHasRecorded(true);
      setRecording(false);
      setError(null);
      onResult({ blob: file, url, name: file.name || "audio.wav" });
    },
    [onResult]
  );

  return (
    <div className="form-group">
      <label>{t("Audio recording")}{required ? " *" : ""}</label>
      <div className="audio-record">
        {!isRecording ? (
          <button
            id="recordButton"
            type="button"
            onClick={startRecording}
            disabled={isRecording}
          >
            <i className="fa-solid fa-microphone me-2"></i>
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
            <i className="fa-solid fa-stop me-2"></i>
            {t("Stop Recording")}
          </button>
        )}
      </div>

      {message && <div className="recording-message">{message}</div>}
      {recorderError && <div className="alert alert-danger">{recorderError}</div>}

      <div className="playback mt-2">
        {audioUrl && <audio src={audioUrl} controls className="w-100" />}
      </div>

      <div className="mt-2">
        <span
          className="text-primary"
          role="button"
          onClick={() => fileRef.current?.click()}
          style={{ cursor: "pointer", textDecoration: "underline" }}
        >
          🎵 {hasRecorded ? t("Upload an audio file instead") : t("Or upload an audio file")}
        </span>
        {audioUrl && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={() => {
              setAudioUrl(null);
              setHasRecorded(false);
              if (fileRef.current) fileRef.current.value = "";
              onClear?.();
            }}
          >
            {t("Remove recording")}
          </button>
        )}
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFileSelected} style={{ display: "none" }} />
      </div>
    </div>
  );
}