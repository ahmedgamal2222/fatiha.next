"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { AudioRecorder, AudioRecordResult } from "@/components/AudioRecorder";

interface Qerat { id: number; qeratName: string; }

const ACADEMIC_ATTAINMENTS = ["Bachelor", "Master", "PostDoctorate", "HighSchool", "None", "Other"];
const CURRENT_POSITIONS = ["Student", "EntryLevel", "Junior", "Intermediate", "Senior", "Managerial", "Executive", "Other"];
const SPOKEN_LANGUAGES = [
  { id: 1, name: "العربية", label: "Arabic" },
  { id: 2, name: "English", label: "English" },
  { id: 3, name: "普通话", label: "Chinese" },
  { id: 4, name: "Español", label: "Spanish" },
  { id: 5, name: "हिंदी", label: "Hindi" },
  { id: 6, name: "Français", label: "French" },
  { id: 7, name: "Русский", label: "Russian" },
  { id: 8, name: "বাংলা", label: "Bengali" },
  { id: 9, name: "Português", label: "Portuguese" },
  { id: 10, name: "اُردُو", label: "Urdu" },
  { id: 11, name: "BahasaIndonesia", label: "Indonesian" },
];

export default function ApplyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  const [qerats, setQerats] = useState<Qerat[]>([]);
  const [description, setDescription] = useState("");
  const [briefOverview, setBriefOverview] = useState("");
  const [academicQualifications, setAcademicQualifications] = useState("");
  const [academicAttainment, setAcademicAttainment] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileImg, setProfileImg] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [gender, setGender] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [alQeratId, setAlQeratId] = useState<number>(0);
  const [audioResult, setAudioResult] = useState<AudioRecordResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    api.get<Qerat[]>("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => setQerats([]));
  }, [user, loading, router]);

  function handleAudioResult(r: AudioRecordResult) { setAudioResult(r); }
  function handleClearAudio() { setAudioResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }

  function onProfileImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImg(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function onCvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  }

  function toggleLanguage(langName: string) {
    setLanguageList((prev) => prev.includes(langName) ? prev.filter((l) => l !== langName) : [...prev, langName]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioResult) { setError(t("Please provide an audio recording")); return; }
    if (!alQeratId) { setError(t("Please select a Qerat")); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData();
    const formData = {
      description, briefOverview, academicQualifications, academicAttainment, currentPosition,
      facebook, twitter, linkedIn, tiktok, instagram, website, gender,
      dateOfBirth: dateOfBirth || new Date().toISOString(),
      alQeratId: String(alQeratId), languagelist: languageList,
    };
    form.append("AuthorizedUser", JSON.stringify(formData));
    form.append("audioFile", audioResult.blob, audioResult.name);
    if (cvFile) form.append("cvFile", cvFile);
    try {
      const res = await api.post("/api/authorized-users/apply", form);
      if (res.success) {
        setSuccess(t("Application submitted successfully!"));
        setTimeout(() => router.push("/"), 2000);
      } else { setError(res.message || (t("Submission failed"))); }
    } catch (err: any) { setError(err.message || (t("Connection error"))); }
    finally { setBusy(false); }
  }

  return (
    <div className="container shadow-lg mb-5 bg-body rounded" style={{ marginTop: 100, marginBottom: 80, padding: 20 }}>
      <h2 className="shadow p-3 mb-5 rounded text-center" style={{ backgroundColor: "#263a5d", color: "white", fontFamily: '"18 Khebrat Musamim Regular", sans-serif', padding: 20, textAlign: "center", fontWeight: 500, lineHeight: "1.25em" }}>
        {t("Apply to become an Authorized User")}
      </h2>
      <form onSubmit={onSubmit} encType="multipart/form-data" style={{ padding: "1.3rem" }}>
        <div className="form-group">
          <label>{t("Audio recording")} *</label>
          <AudioRecorder onResult={handleAudioResult} onClear={handleClearAudio} required />
        </div>
        <div className="form-group">
          <label>{t("Description")}</label>
          <textarea className="form-control" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t("Brief Overview")}</label>
          <textarea className="form-control" rows={4} value={briefOverview} onChange={(e) => setBriefOverview(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t("Academic Qualifications")}</label>
          <textarea className="form-control" rows={4} value={academicQualifications} onChange={(e) => setAcademicQualifications(e.target.value)} />
        </div>


        <div className="form-group">
          <label>{t("Academic Attainment")}</label>
          <select className="form-control" value={academicAttainment} onChange={(e) => setAcademicAttainment(e.target.value)}>
            <option value="">{t("Select...")}</option>
            {ACADEMIC_ATTAINMENTS.map((a) => (<option key={a} value={a}>{t(a)}</option>))}
          </select>
        </div>
        <div className="form-group">
          <label>{t("Current Position")}</label>
          <select className="form-control" value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)}>
            <option value="">{t("Select...")}</option>
            {CURRENT_POSITIONS.map((p) => (<option key={p} value={p}>{t(p)}</option>))}
          </select>
        </div>
        <div className="form-group">
          <label>{t("CV")}</label>
          <input type="file" className="form-control" onChange={onCvFileChange} accept="application/pdf" />
        </div>
        <div className="form-group">
          <label>{t("Your Image")}</label>
          <input type="file" className="form-control" onChange={onProfileImgChange} accept="image/*" />
          {imagePreview && <img src={imagePreview} alt="Preview" className="preview-image" style={{ maxWidth: 200, marginTop: 10 }} />}
        </div>
        <div className="row">
          <div className="form-group col-6">
            <label>{t("Facebook")}</label>
            <input type="text" className="form-control" value={facebook} onChange={(e) => setFacebook(e.target.value)} maxLength={300} />
          </div>
          <div className="form-group col-6">
            <label>{t("Twitter")}</label>
            <input type="text" className="form-control" value={twitter} onChange={(e) => setTwitter(e.target.value)} maxLength={300} />
          </div>
          <div className="form-group col-6">
            <label>{t("LinkedIn")}</label>
            <input type="text" className="form-control" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} maxLength={300} />
          </div>
          <div className="form-group col-6">
            <label>{t("TikTok")}</label>
            <input type="text" className="form-control" value={tiktok} onChange={(e) => setTiktok(e.target.value)} maxLength={300} />
          </div>
        </div>
        <div className="row">
          <div className="form-group col-6">
            <label>{t("Gender")}</label>
            <select className="form-control" value={String(gender)} onChange={(e) => setGender(e.target.value === "true")}>
              <option value="true">{t("Male")}</option>
              <option value="false">{t("Female")}</option>
            </select>
          </div>
          <div className="form-group col-6">
            <label>{t("Date of Birth")}</label>
            <input type="date" className="form-control" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
        </div>
        <div className="language-instructions">
          <p>{t("Press Ctrl (Windows) or Cmd (Mac) and click on languages you speak. Click again to remove.")}</p>
        </div>
        <div className="form-group">
          <label className="fw-bold mb-2 d-flex align-items-center">
            <i className="fas fa-globe me-2 text-primary"></i> {t("Spoken Languages")}
          </label>
          <select className="form-control stylish-select" multiple value={languageList} onChange={(e) => {
            const options = Array.from(e.target.selectedOptions, (o) => o.value);
            setLanguageList(options);
          }} style={{ minHeight: 100, maxHeight: 180 }}>
            {SPOKEN_LANGUAGES.map((l) => (<option key={l.id} value={l.name}>{t(l.label)}</option>))}
          </select>
        </div>
        <div className="form-group">
          <label>{t("AlQerat")}</label>
          <select className="form-control" value={alQeratId} onChange={(e) => setAlQeratId(Number(e.target.value))}>
            <option value={0} disabled>{t("Select a Qerat...")}</option>
            {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
          </select>
        </div>
        <div className="form-group">
          <button type="submit" className="btn btn-danger" disabled={busy} style={{ background: "linear-gradient(135deg, #dc3545, #ff6b6b)", color: "white", fontSize: 18, padding: "12px 30px", borderRadius: 8, border: "none" }}>
            {busy ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {t("Submit")}
          </button>
        </div>
        {success && <div className="alert alert-success"><i className="fas fa-check-circle me-2" />{success}</div>}
        {error && <div className="alert alert-danger"><i className="fas fa-exclamation-circle me-2" />{error}</div>}
      </form>
    </div>
  );
}
