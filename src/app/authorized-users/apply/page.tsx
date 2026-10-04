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
    <div className="fh-page">
      <header className="fh-page__header">
        <div className="fh-container">
          <span className="fh-page__icon"><i className="fas fa-user-graduate"></i></span>
          <h1 className="fh-page__title">{t("Apply to become an Authorized User")}</h1>
          <p className="fh-page__subtitle">{t("Share your recitation, qualifications and background to become a certified instructor.")}</p>
        </div>
      </header>

      <div className="fh-container" style={{ maxWidth: 860 }}>
        {success && <div className="alert alert-success rounded-4"><i className="fas fa-check-circle me-2" />{success}</div>}
        {error && <div className="alert alert-danger rounded-4"><i className="fas fa-exclamation-circle me-2" />{error}</div>}

        <form onSubmit={onSubmit} encType="multipart/form-data">
          {/* التسجيل الصوتي */}
          <div className="fh-card mb-4">
            <div className="fh-card__head"><i className="fas fa-microphone-lines"></i><h3>{t("Recitation Recording")}</h3></div>
            <div className="fh-card__body">
              <AudioRecorder onResult={handleAudioResult} onClear={handleClearAudio} required />
            </div>
          </div>

          {/* المعلومات الأساسية */}
          <div className="fh-card mb-4">
            <div className="fh-card__head"><i className="fas fa-id-card"></i><h3>{t("About You")}</h3></div>
            <div className="fh-card__body">
              <div className="mb-3">
                <label className="fh-label">{t("Description")}</label>
                <textarea className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Tell us about yourself...")} />
              </div>
              <div className="mb-3">
                <label className="fh-label">{t("Brief Overview")}</label>
                <textarea className="form-control" rows={3} value={briefOverview} onChange={(e) => setBriefOverview(e.target.value)} />
              </div>
              <div className="mb-0">
                <label className="fh-label">{t("Academic Qualifications")}</label>
                <textarea className="form-control" rows={3} value={academicQualifications} onChange={(e) => setAcademicQualifications(e.target.value)} />
              </div>
            </div>
          </div>

          {/* المؤهلات والملفات */}
          <div className="fh-card mb-4">
            <div className="fh-card__head"><i className="fas fa-graduation-cap"></i><h3>{t("Qualifications & Files")}</h3></div>
            <div className="fh-card__body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="fh-label">{t("Academic Attainment")}</label>
                  <select className="form-select" value={academicAttainment} onChange={(e) => setAcademicAttainment(e.target.value)}>
                    <option value="">{t("Select...")}</option>
                    {ACADEMIC_ATTAINMENTS.map((a) => (<option key={a} value={a}>{t(a)}</option>))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="fh-label">{t("Current Position")}</label>
                  <select className="form-select" value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)}>
                    <option value="">{t("Select...")}</option>
                    {CURRENT_POSITIONS.map((p) => (<option key={p} value={p}>{t(p)}</option>))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="fh-label">{t("AlQerat")} <span className="req">*</span></label>
                  <select className="form-select" value={alQeratId} onChange={(e) => setAlQeratId(Number(e.target.value))}>
                    <option value={0} disabled>{t("Select a Qerat...")}</option>
                    {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="fh-label">{t("CV")}</label>
                  <input type="file" className="form-control" onChange={onCvFileChange} accept="application/pdf" />
                </div>
                <div className="col-md-6">
                  <label className="fh-label">{t("Your Image")}</label>
                  <input type="file" className="form-control" onChange={onProfileImgChange} accept="image/*" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {imagePreview && <img src={imagePreview} alt="Preview" className="rounded-3 border mt-2" style={{ maxWidth: 140 }} />}
                </div>
                <div className="col-md-3">
                  <label className="fh-label">{t("Gender")}</label>
                  <select className="form-select" value={String(gender)} onChange={(e) => setGender(e.target.value === "true")}>
                    <option value="true">{t("Male")}</option>
                    <option value="false">{t("Female")}</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="fh-label">{t("Date of Birth")}</label>
                  <input type="date" className="form-control" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
              </div>

              <div className="mt-3">
                <label className="fh-label"><i className="fas fa-globe me-2 text-primary"></i>{t("Spoken Languages")}</label>
                <div className="d-flex flex-wrap gap-2">
                  {SPOKEN_LANGUAGES.map((l) => {
                    const active = languageList.includes(l.name);
                    return (
                      <button key={l.id} type="button" onClick={() => toggleLanguage(l.name)}
                        className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-primary"}`}>
                        {active && <i className="fas fa-check me-1" />}{t(l.label)}
                      </button>
                    );
                  })}
                </div>
                <div className="fh-hint">{t("Click the languages you speak to select or deselect them.")}</div>
              </div>
            </div>
          </div>

          {/* روابط التواصل */}
          <div className="fh-card mb-4">
            <div className="fh-card__head"><i className="fas fa-share-nodes"></i><h3>{t("Social Links")}</h3></div>
            <div className="fh-card__body">
              <div className="row g-3">
                <div className="col-md-6"><label className="fh-label">{t("Facebook")}</label><input type="text" className="form-control" value={facebook} onChange={(e) => setFacebook(e.target.value)} maxLength={300} /></div>
                <div className="col-md-6"><label className="fh-label">{t("Twitter")}</label><input type="text" className="form-control" value={twitter} onChange={(e) => setTwitter(e.target.value)} maxLength={300} /></div>
                <div className="col-md-6"><label className="fh-label">{t("LinkedIn")}</label><input type="text" className="form-control" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} maxLength={300} /></div>
                <div className="col-md-6"><label className="fh-label">{t("TikTok")}</label><input type="text" className="form-control" value={tiktok} onChange={(e) => setTiktok(e.target.value)} maxLength={300} /></div>
                <div className="col-md-6"><label className="fh-label">{t("Instagram")}</label><input type="text" className="form-control" value={instagram} onChange={(e) => setInstagram(e.target.value)} maxLength={300} /></div>
                <div className="col-md-6"><label className="fh-label">{t("Website")}</label><input type="text" className="form-control" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={300} /></div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-2" />}
            {t("Submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
