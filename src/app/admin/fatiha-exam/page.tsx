"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

interface ExamQ {
  id: number;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  correctAnswer: number;
  languageId: number;
}
interface Language { id: number; languageName: number; }
interface Qerat { id: number; qeratName: string; }

const LANGUAGE_NAMES: Record<number, string> = {
  1: "العربية", 2: "English", 3: "中文", 4: "Español", 5: "हिन्दी", 6: "Français",
  7: "Русский", 8: "বাংলা", 9: "Português", 10: "اردو", 11: "Bahasa Indonesia",
};

const EMPTY = { question: "", answer1: "", answer2: "", answer3: "", answer4: "", correctAnswer: 1, languageId: 1 };

function Inner() {
  const { t } = useI18n();
  const [items, setItems] = useState<ExamQ[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [filterLang, setFilterLang] = useState<number>(0);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // توليد AI
  const [genLang, setGenLang] = useState<number>(1);
  const [genQerat, setGenQerat] = useState<number>(0);
  const [genCount, setGenCount] = useState<number>(5);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    api.get<ExamQ[]>("/api/fatiha-exam").then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
    api.get<Language[]>("/api/reference/languages", false).then((r) => setLanguages(r.data ?? [])).catch(() => {});
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => {});
  }, [load]);

  function resetForm() { setForm({ ...EMPTY }); setEditId(null); }
  function startEdit(q: ExamQ) {
    setForm({ question: q.question, answer1: q.answer1, answer2: q.answer2, answer3: q.answer3, answer4: q.answer4, correctAnswer: q.correctAnswer, languageId: q.languageId });
    setEditId(q.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!form.question.trim()) { setErr(t("Question is required")); return; }
    setBusy(true);
    try {
      if (editId) { await api.put(`/api/fatiha-exam/${editId}`, form); setMsg(t("Updated successfully")); }
      else { await api.post("/api/fatiha-exam", form); setMsg(t("Created successfully")); }
      resetForm(); load();
    } catch { setErr(t("Operation failed")); }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!confirm(t("Delete this question?"))) return;
    try { await api.del(`/api/fatiha-exam/${id}`); if (editId === id) resetForm(); load(); }
    catch { setErr(t("Delete failed")); }
  }

  async function generate() {
    setGenerating(true); setMsg(""); setErr("");
    try {
      const body: Record<string, unknown> = { languageId: genLang, count: genCount, save: true };
      if (genQerat) body.qeratId = genQerat;
      const res = await api.post<ExamQ[]>("/api/fatiha-exam/generate", body);
      if (res.success) { setMsg(t("{n} questions generated").replace("{n}", String(res.data?.length ?? 0))); load(); }
      else { setErr(res.message || t("Generation failed")); }
    } catch (e: any) { setErr(e?.result?.message || e?.message || t("Generation failed")); }
    finally { setGenerating(false); }
  }

  const filtered = filterLang ? items.filter((q) => q.languageId === filterLang) : items;

  return (
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-circle-question"></i></span>
          <h1 className="fh-page__title">{t("Manage Exam Questions")}</h1>
          <p className="fh-page__subtitle">{t("Create the qualifying exam question bank manually or generate it with AI based on a recitation.")}</p>
        </div>
      </header>

      <div className="fh-container">
        {msg && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{msg}</div>}
        {err && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{err}</div>}

        {/* توليد بالذكاء الاصطناعي */}
        <div className="fh-card mb-4" style={{ borderColor: "rgba(233,163,25,0.5)" }}>
          <div className="fh-card__head" style={{ background: "rgba(233,163,25,0.08)" }}>
            <i className="fas fa-wand-magic-sparkles" style={{ color: "var(--accent-dark)" }}></i>
            <h3>{t("Generate with AI")}</h3>
          </div>
          <div className="fh-card__body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="fh-label">{t("Language")}</label>
                <select className="form-select" value={genLang} onChange={(e) => setGenLang(Number(e.target.value))}>
                  {languages.map((l) => (<option key={l.id} value={l.id}>{LANGUAGE_NAMES[l.languageName] ?? `#${l.languageName}`}</option>))}
                  {languages.length === 0 && Object.entries(LANGUAGE_NAMES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="fh-label">{t("Recitation")} <span className="text-muted small">({t("optional")})</span></label>
                <select className="form-select" value={genQerat} onChange={(e) => setGenQerat(Number(e.target.value))}>
                  <option value={0}>{t("General (Al-Fatiha & Tajweed)")}</option>
                  {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="fh-label">{t("Count")}</label>
                <input type="number" min={1} max={20} className="form-control" value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" onClick={generate} disabled={generating}>
                  {generating ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="fas fa-wand-magic-sparkles me-1" />}
                  {t("Generate")}
                </button>
              </div>
            </div>
            <div className="fh-hint mt-2"><i className="fas fa-circle-info me-1"></i>{t("Generated questions are added to the bank and used randomly in exams.")}</div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="fh-card">
              <div className="fh-card__head"><i className={`fas ${editId ? "fa-pen" : "fa-plus-circle"}`}></i><h3>{editId ? t("Edit Question") : t("New Question")}</h3></div>
              <div className="fh-card__body">
                <form onSubmit={save}>
                  <div className="mb-3">
                    <label className="fh-label">{t("Language")}</label>
                    <select className="form-select" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}>
                      {languages.map((l) => (<option key={l.id} value={l.id}>{LANGUAGE_NAMES[l.languageName] ?? `#${l.languageName}`}</option>))}
                      {languages.length === 0 && Object.entries(LANGUAGE_NAMES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="fh-label">{t("Question")} <span className="req">*</span></label>
                    <textarea className="form-control" rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
                  </div>
                  {[1, 2, 3, 4].map((n) => (
                    <div className="mb-2" key={n}>
                      <label className="fh-label d-flex align-items-center gap-2">
                        <input type="radio" name="correct" checked={form.correctAnswer === n} onChange={() => setForm({ ...form, correctAnswer: n })} />
                        {t("Answer")} {n} {form.correctAnswer === n && <span className="badge bg-success">{t("Correct")}</span>}
                      </label>
                      <input className="form-control" value={(form as any)[`answer${n}`]} onChange={(e) => setForm({ ...form, [`answer${n}`]: e.target.value })} required />
                    </div>
                  ))}
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary flex-grow-1" disabled={busy}>{editId ? t("Update") : t("Create")}</button>
                    {editId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>{t("Cancel")}</button>}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="fh-card">
              <div className="fh-card__head">
                <i className="fas fa-list"></i><h3>{t("Questions")}</h3>
                <select className="form-select form-select-sm ms-auto" style={{ width: "auto" }} value={filterLang} onChange={(e) => setFilterLang(Number(e.target.value))}>
                  <option value={0}>{t("All languages")}</option>
                  {Object.entries(LANGUAGE_NAMES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
                </select>
                <span className="badge bg-primary-subtle text-primary ms-2">{filtered.length}</span>
              </div>
              <div className="fh-card__body">
                {filtered.length === 0 ? (
                  <div className="fh-empty"><i className="fas fa-circle-question"></i><p className="mb-0">{t("No questions yet")}</p></div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {filtered.map((q) => (
                      <div key={q.id} className="fh-req" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <div className="d-flex justify-content-between gap-2">
                          <div className="fh-req__main">
                            <div className="fh-req__title"><i className="fas fa-circle-question text-primary" /><span>{q.question}</span></div>
                            <div className="fh-req__meta">
                              <span className="badge bg-primary-subtle text-primary">{LANGUAGE_NAMES[q.languageId] ?? `#${q.languageId}`}</span>
                            </div>
                          </div>
                          <div className="fh-req__actions">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(q)}><i className="fas fa-pen" /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => remove(q.id)}><i className="fas fa-trash" /></button>
                          </div>
                        </div>
                        <ul className="mt-2 mb-0 ps-3 small">
                          {[q.answer1, q.answer2, q.answer3, q.answer4].map((a, i) => (
                            <li key={i} className={q.correctAnswer === i + 1 ? "text-success fw-bold" : "text-muted"}>
                              {a}{q.correctAnswer === i + 1 && <i className="fas fa-check ms-1" />}
                            </li>
                          ))}
                        </ul>
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

export default function AdminExamPage() {
  return (<AdminGuard><Inner /></AdminGuard>);
}
