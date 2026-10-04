"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api, API_URL } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface Qerat {
  id: number;
  qeratName: string;
  description?: string | null;
  audioFile?: string | null;
}

function audioSrc(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return API_URL + "/files/" + key.replace(/^\/+/, "");
}

function Inner() {
  const { t } = useI18n();
  const [items, setItems] = useState<Qerat[]>([]);
  const [form, setForm] = useState({ qeratName: "", description: "", audioFile: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ qeratName: "", description: "", audioFile: "" });
    setEditId(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(q: Qerat) {
    setForm({ qeratName: q.qeratName, description: q.description ?? "", audioFile: q.audioFile ?? "" });
    setEditId(q.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onAudioSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "qerat-audio");
      const res = await api.upload<{ key: string }>("/api/uploads", fd);
      if (res.success && res.data?.key) {
        setForm((f) => ({ ...f, audioFile: res.data!.key }));
        setMsg(t("Audio uploaded"));
      } else { setErr(res.message || t("Upload failed")); }
    } catch { setErr(t("Upload failed")); }
    finally { setUploading(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!form.qeratName.trim()) { setErr(t("Name is required")); return; }
    setBusy(true);
    const payload = {
      qeratName: form.qeratName.trim(),
      description: form.description.trim() || undefined,
      audioFile: form.audioFile || undefined,
    };
    try {
      if (editId) {
        await api.put(`/api/al-qerat/${editId}`, payload);
        setMsg(t("Updated successfully"));
      } else {
        await api.post("/api/al-qerat", payload);
        setMsg(t("Created successfully"));
      }
      resetForm();
      load();
    } catch { setErr(t("Operation failed")); }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!confirm(t("Delete this recitation?"))) return;
    try {
      await api.del(`/api/al-qerat/${id}`);
      if (editId === id) resetForm();
      load();
    } catch { setErr(t("Delete failed")); }
  }

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-book-quran"></i></span>
          <h1 className="fh-page__title">{t("Manage Recitations")}</h1>
          <p className="fh-page__subtitle">{t("Add, edit and remove the Quran recitations available for Ijazah requests.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {msg && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{msg}</div>}
        {err && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="fh-card">
              <div className="fh-card__head">
                <i className={`fas ${editId ? "fa-pen" : "fa-plus-circle"}`}></i>
                <h3>{editId ? t("Edit Recitation") : t("New Recitation")}</h3>
              </div>
              <div className="fh-card__body">
                <form onSubmit={save}>
                  <div className="mb-3">
                    <label className="fh-label">{t("Recitation Name")} <span className="req">*</span></label>
                    <input className="form-control" value={form.qeratName} placeholder={t("e.g. Hafs an Asim")}
                      onChange={(e) => setForm({ ...form, qeratName: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="fh-label">{t("Description")}</label>
                    <textarea className="form-control" rows={3} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder={t("Short description of the recitation...")} />
                  </div>
                  <div className="mb-3">
                    <label className="fh-label">{t("Reference Audio")}</label>
                    <input ref={fileRef} type="file" accept="audio/*" className="form-control" onChange={onAudioSelected} />
                    {uploading && <div className="fh-hint"><span className="spinner-border spinner-border-sm me-2" />{t("Uploading...")}</div>}
                    {form.audioFile && !uploading && (
                      <div className="fh-media-box mt-2">
                        <label className="fh-label mb-2"><i className="fas fa-music me-1" />{t("Current Audio")}</label>
                        <audio controls src={audioSrc(form.audioFile)!} className="w-100" />
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary flex-grow-1" disabled={busy || uploading}>
                      {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className={`fas ${editId ? "fa-save" : "fa-plus"} me-1`} />}
                      {editId ? t("Update") : t("Create")}
                    </button>
                    {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>{t("Cancel")}</button>}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="fh-card">
              <div className="fh-card__head">
                <i className="fas fa-list"></i>
                <h3>{t("Recitations")}</h3>
                <span className="badge bg-primary-subtle text-primary ms-auto">{items.length}</span>
              </div>
              <div className="fh-card__body">
                {items.length === 0 ? (
                  <div className="fh-empty"><i className="fas fa-book"></i><p className="mb-0">{t("No recitations yet")}</p></div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {items.map((q) => (
                      <div key={q.id} className="fh-req">
                        <div className="fh-req__main">
                          <div className="fh-req__title">
                            <i className="fas fa-book-quran text-primary" />
                            <span>{q.qeratName}</span>
                          </div>
                          {q.description && <p className="fh-req__meta mb-2" style={{ display: "block" }}>{q.description}</p>}
                          {audioSrc(q.audioFile) && <audio controls src={audioSrc(q.audioFile)!} className="w-100 mt-1" />}
                        </div>
                        <div className="fh-req__actions">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(q)}><i className="fas fa-pen" /></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(q.id)}><i className="fas fa-trash" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAlQeratPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
