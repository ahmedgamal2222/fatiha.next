"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

/**
 * رفع الوسائط إلى R2 عبر /api/uploads + اختيار من الجهاز/الرابط/السحب والإفلات.
 * يُستخدم في محرّر الصفحات وصفحات الكتب والمدوّنة والمتجر.
 */

export interface UploadResult {
  key: string;
  url: string;
  type?: string;
  size?: number;
}

/** يرفع ملفاً إلى R2 ويعيد رابطَه العام. */
export async function uploadFile(file: File, folder = "uploads"): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const r = await api.upload<UploadResult>("/api/uploads", fd);
  if (!r.data?.url) throw new Error("upload failed");
  return r.data;
}

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/ogg";

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogv|ogg)$/i.test(url);
}

interface PickerProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  /** نوع الوسيط: صورة (افتراضي) أو فيديو أو ملف */
  kind?: "image" | "video" | "file";
  label?: string;
  placeholder?: string;
  previewHeight?: number;
}

/** منتقي وسيط واحد: رابط + رفع من الجهاز + معاينة. */
export function MediaPicker({
  value,
  onChange,
  folder = "uploads",
  kind = "image",
  label,
  placeholder = "https://…",
  previewHeight = 140,
}: PickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  const accept = kind === "video" ? VIDEO_ACCEPT : kind === "file" ? `${IMAGE_ACCEPT},application/pdf` : IMAGE_ACCEPT;

  async function doUpload(file?: File | null) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const res = await uploadFile(file, folder);
      onChange(res.url);
    } catch {
      setErr(t("Upload failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mp">
      {label ? <label className="form-label small mb-1 text-muted">{label}</label> : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void doUpload(f);
        }}
      />

      <div className="input-group input-group-sm mb-2">
        <input className="form-control" dir="ltr" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn btn-outline-primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-upload" />}
          <span className="d-none d-lg-inline ms-1">{busy ? t("Uploading...") : t("Upload")}</span>
        </button>
        {value ? (
          <button type="button" className="btn btn-outline-danger" onClick={() => onChange("")} title={t("Remove")}>
            <i className="fas fa-xmark" />
          </button>
        ) : null}
      </div>

      {err ? <div className="text-danger small mb-2">{err}</div> : null}

      <div
        className={`mp__drop${drag ? " mp__drop--on" : ""}`}
        style={{ minHeight: previewHeight }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void doUpload(e.dataTransfer.files?.[0]);
        }}
      >
        {!value ? (
          <div className="mp__hint">
            <i className="fas fa-cloud-arrow-up fa-2x mb-2" />
            <div className="small">{t("Drag & drop or click to upload")}</div>
          </div>
        ) : kind === "video" ? (
          isVideoUrl(value) ? (
            <video src={value} controls className="mp__media" />
          ) : (
            <div className="mp__hint">
              <i className="fas fa-video fa-2x mb-2" />
              <div className="small" dir="ltr">{value}</div>
            </div>
          )
        ) : kind === "file" ? (
          <div className="mp__hint">
            <i className="fas fa-file-pdf fa-2x mb-2" />
            <div className="small" dir="ltr">{value}</div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="mp__media" />
        )}
      </div>
    </div>
  );
}

interface ListProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
}

/** منتقي معرض صور: رفع متعدّد + إضافة برابط + ترتيب + حذف. */
export function MediaListPicker({ value, onChange, folder = "uploads", max = 24 }: ListProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  const list = Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];

  async function addFiles(files: FileList | null | undefined) {
    if (!files || !files.length) return;
    setBusy(true);
    setErr("");
    try {
      const room = Math.max(0, max - list.length);
      const picked = Array.from(files).slice(0, room);
      const urls: string[] = [];
      for (const f of picked) {
        const res = await uploadFile(f, folder);
        urls.push(res.url);
      }
      if (urls.length) onChange([...list, ...urls]);
    } catch {
      setErr(t("Upload failed"));
    } finally {
      setBusy(false);
    }
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
    onChange(copy);
  };
  const remove = (i: number) => onChange(list.filter((_, k) => k !== i));

  return (
    <div className="mpl">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          const files = e.target.files;
          e.target.value = "";
          void addFiles(files);
        }}
      />

      <div className="d-flex gap-1 mb-2">
        <input
          className="form-control form-control-sm"
          dir="ltr"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          title={t("Add image")}
          onClick={() => {
            if (url.trim()) {
              onChange([...list, url.trim()]);
              setUrl("");
            }
          }}
        >
          <i className="fas fa-plus" />
        </button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} title={t("Upload")} onClick={() => inputRef.current?.click()}>
          {busy ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-upload" />}
        </button>
      </div>

      {err ? <div className="text-danger small mb-2">{err}</div> : null}

      <div
        className={`mpl__grid${drag ? " mpl__grid--on" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        {list.map((src, i) => (
          <div key={`${src}-${i}`} className="mpl__item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
            <div className="mpl__tools">
              <button type="button" onClick={() => move(i, -1)} title={t("Move up")}>
                <i className="fas fa-arrow-left" />
              </button>
              <button type="button" onClick={() => move(i, 1)} title={t("Move down")}>
                <i className="fas fa-arrow-right" />
              </button>
              <button type="button" className="mpl__del" onClick={() => remove(i)} title={t("Remove")}>
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="mpl__add" disabled={busy || list.length >= max} onClick={() => inputRef.current?.click()}>
          <i className="fas fa-plus" />
          <span>{t("Add image")}</span>
        </button>
      </div>
    </div>
  );
}
