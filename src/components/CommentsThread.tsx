"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export interface CommentItem {
  id: number;
  comment: string;
  audioRecord?: string | null;
  dateOfRecord: number;
  applicationUserId: string;
  authorName?: string | null;
  authorRole?: string | null;
}

function audioSrc(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return API_URL + "/files/" + key.replace(/^\/+/, "");
}

/** سلسلة تعليقات احترافية على طلب الفاتحة — نص + تسجيل صوتي، مع حذف للأدمن/صاحب التعليق. */
export function CommentsThread({ requestId }: { requestId: number }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("comment.wav");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("audio/webm");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const isAdmin = user?.role === "Admin";

  const load = useCallback(() => {
    api.get<CommentItem[]>(`/api/fatiha-requests/${requestId}/comments`)
      .then((r) => setComments(r.data ?? [])).catch(() => setComments([]));
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  // تنظيف التسجيل عند الخروج من المكوّن (إيقاف الميكروفون + تحرير الروابط المؤقتة)
  useEffect(() => {
    const live = { recorderRef, streamRef };
    return () => {
      try { live.recorderRef.current?.stop(); } catch { /* ignore */ }
      live.streamRef.current?.getTracks().forEach((tr) => { try { tr.stop(); } catch { /* ignore */ } });
      live.recorderRef.current = null;
      live.streamRef.current = null;
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((tr) => { try { tr.stop(); } catch { /* ignore */ } });
    streamRef.current = null;
  }

  /** يختار صيغة تسجيل مدعومة (Safari لا يدعم webm) بدل الادّعاء الكاذب بأنها wav. */
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

  async function startRec() {
    try {
      setErr("");
      if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
        if (!window.isSecureContext) {
          setErr(t("Microphone requires a secure connection (HTTPS) or localhost — try uploading an audio file."));
        } else {
          setErr(t("Microphone is not supported in this browser — upload an audio file instead."));
        }
        fileRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mimeRef.current = rec.mimeType || mime || "audio/webm";
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onerror = () => {
        setErr(t("Recording failed — try uploading an audio file."));
        setRecording(false);
        stopStream();
      };
      rec.onstop = () => {
        if (chunksRef.current.length > 0) {
          const type = mimeRef.current || "audio/webm";
          const blob = new Blob(chunksRef.current, { type });
          if (audioUrl) { try { URL.revokeObjectURL(audioUrl); } catch { /* ignore */ } }
          setAudio(blob);
          setAudioUrl(URL.createObjectURL(blob));
          setAudioName(`comment-${Date.now()}.${extFor(type)}`);
        } else {
          setErr(t("No audio was captured — please try again."));
        }
        stopStream();
      };
      recorderRef.current = rec;
      streamRef.current = stream;
      rec.start();
      setRecording(true);
    } catch {
      if (!window.isSecureContext) {
        setErr(t("Microphone requires a secure connection (HTTPS) or localhost — try uploading an audio file."));
      } else {
        setErr(t("Microphone access was denied — try uploading an audio file."));
      }
    }
  }
  function stopRec() { try { recorderRef.current?.stop(); } catch { /* ignore */ } setRecording(false); }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (audioUrl) { try { URL.revokeObjectURL(audioUrl); } catch { /* ignore */ } }
    setAudio(f);
    setAudioUrl(URL.createObjectURL(f));
    setAudioName(f.name || `comment-${Date.now()}.wav`);
  }
  function clearAudio() {
    setAudio(null);
    if (audioUrl) { try { URL.revokeObjectURL(audioUrl); } catch { /* ignore */ } }
    setAudioUrl(null);
    setAudioName("comment.wav");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !audio) { setErr(t("The comment or recording is required")); return; }
    setBusy(true); setErr("");
    try {
      const form = new FormData();
      if (text.trim()) form.append("comment", text.trim());
      if (audio) form.append("audioRecord", audio, audioName);
      const res = await api.post(`/api/fatiha-requests/${requestId}/comments`, form);
      if (!res.success) throw new Error(res.message || "failed");
      setText(""); clearAudio();
      await load();
    } catch (err) {
      setErr(err instanceof Error && err.message && err.message !== "failed"
        ? err.message
        : t("Operation failed"));
    }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!confirm(t("Delete this comment?"))) return;
    try { await api.del(`/api/fatiha-requests/${requestId}/comments/${id}`); load(); }
    catch { setErr(t("Delete failed")); }
  }

  return (
    <div className="fh-comments">
      <div className="fh-comments__list">
        {comments.length === 0 ? (
          <p className="text-muted small mb-3"><i className="fas fa-comments me-1" />{t("No comments yet")}</p>
        ) : (
          comments.map((cm) => {
            const mine = cm.applicationUserId === user?.id;
            const privileged = cm.authorRole === "Admin" || cm.authorRole === "Authorized";
            return (
              <div key={cm.id} className={`fh-comment ${mine ? "fh-comment--mine" : ""}`}>
                <div className="fh-comment__avatar" style={privileged ? { background: "var(--accent)" } : undefined}>
                  <i className={`fas ${privileged ? "fa-user-shield" : "fa-user"}`}></i>
                </div>
                <div className="fh-comment__body">
                  <div className="fh-comment__head">
                    <span className="fh-comment__author">
                      {cm.authorName ?? t("User")}
                      {privileged && <span className="badge bg-primary-subtle text-primary ms-2">{t(cm.authorRole === "Admin" ? "Admin" : "Authorized")}</span>}
                    </span>
                    <span className="fh-comment__time">{new Date(cm.dateOfRecord).toLocaleString(ar ? "ar-EG" : "en-US")}</span>
                  </div>
                  {cm.comment && cm.comment !== "🎙️" && <p className="fh-comment__text">{cm.comment}</p>}
                  {audioSrc(cm.audioRecord) && <audio controls src={audioSrc(cm.audioRecord)!} className="w-100 mt-1" />}
                </div>
                {(isAdmin || mine) && (
                  <button className="fh-comment__del" title={t("Delete")} onClick={() => remove(cm.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {err && <div className="alert alert-danger rounded-4 py-2">{err}</div>}

      <form onSubmit={submit} className="fh-comments__form">
        <textarea className="form-control" rows={2} value={text} placeholder={t("Write a comment...")}
          onChange={(e) => setText(e.target.value)} />
        {audioUrl && (
          <div className="fh-media-box mt-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-bold"><i className="fas fa-microphone me-1" />{t("Voice comment")}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearAudio}><i className="fas fa-trash" /></button>
            </div>
            <audio controls src={audioUrl} className="w-100" />
          </div>
        )}
        <div className="d-flex gap-2 mt-2 flex-wrap">
          {!recording ? (
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={startRec}>
              <i className="fas fa-microphone me-1" />{t("Record")}
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-danger button-animate" onClick={stopRec}>
              <i className="fas fa-stop me-1" />{t("Stop")}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fileRef.current?.click()}>
            <i className="fas fa-file-audio me-1" />{t("Upload")}
          </button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" style={{ display: "none" }} onChange={onFile} />
          <button type="submit" className="btn btn-sm btn-primary ms-auto" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="fas fa-paper-plane me-1" />}
            {t("Send")}
          </button>
        </div>
      </form>
    </div>
  );
}
