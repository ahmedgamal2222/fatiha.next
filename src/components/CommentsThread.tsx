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
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const isAdmin = user?.role === "Admin";

  const load = useCallback(() => {
    api.get<CommentItem[]>(`/api/fatiha-requests/${requestId}/comments`)
      .then((r) => setComments(r.data ?? [])).catch(() => setComments([]));
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudio(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((tr) => tr.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch { setErr(t("Microphone access was denied — try uploading an audio file.")); }
  }
  function stopRec() { recorderRef.current?.stop(); setRecording(false); }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudio(f); setAudioUrl(URL.createObjectURL(f));
  }
  function clearAudio() {
    setAudio(null); setAudioUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !audio) { setErr(t("The comment or recording is required")); return; }
    setBusy(true); setErr("");
    try {
      const form = new FormData();
      if (text.trim()) form.append("comment", text.trim());
      if (audio) form.append("audioRecord", audio, `comment-${Date.now()}.wav`);
      await api.post(`/api/fatiha-requests/${requestId}/comments`, form);
      setText(""); clearAudio();
      load();
    } catch { setErr(t("Operation failed")); }
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
