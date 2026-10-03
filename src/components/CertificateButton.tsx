"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

/**
 * مولّد الشهادة — يرسم بيانات الإجازة فوق قالب الشهادة (Cert.jpeg) على canvas،
 * ثم يغلّفها في ملف PDF عبر pdf-lib ويُنزّلها. يعالج المتصفح تشكيل النص العربي تلقائياً.
 */

interface CertData {
  certificateId: number;
  applicantName: { arabic: string; english: string };
  sheikhName: { arabic: string; english: string };
  alQeratName: string;
  dateOfIssue: number;
}

const VERIFY_BASE = "https://fatiha.id/verify";
const TEMPLATE = "/Cert.jpeg";

// نصوص الشهادة حسب اللغة
const L: Record<string, { title: string; presented: string; forRecite: string; instructor: string; date: string; no: string }> = {
  ar: { title: "شهادة إجازة بسورة الفاتحة", presented: "تُمنح هذه الشهادة بكل فخر إلى", forRecite: "لتلاوته سورة الفاتحة وفقاً لقراءة", instructor: "المُجيز", date: "التاريخ", no: "رقم الشهادة" },
  en: { title: "Surat Al-Fatiha Ijazah Certificate", presented: "This certificate is proudly presented to", forRecite: "for reciting Surat Al-Fatiha according to the recitation of", instructor: "Instructor", date: "Date", no: "Certificate No." },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function CertificateButton({ certificateId }: { certificateId: number }) {
  const { lang, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.get<CertData>(`/api/certificates/${certificateId}/data`);
      const data = res.data!;
      const strings = L[lang === "ar" ? "ar" : "en"];

      const bg = await loadImage(TEMPLATE);
      const canvas = document.createElement("canvas");
      canvas.width = bg.naturalWidth || 1600;
      canvas.height = bg.naturalHeight || 1132;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = "#1f2937";

      // العنوان
      ctx.font = "bold 46px Arial, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#0f766e";
      ctx.fillText(strings.title, cx, 360);

      // سطر التقديم
      ctx.fillStyle = "#334155";
      ctx.font = "26px Arial, 'Segoe UI', sans-serif";
      ctx.fillText(strings.presented, cx, 450);

      // اسم المُجاز (الأبرز)
      const name = (lang === "ar" ? data.applicantName.arabic : data.applicantName.english) || data.applicantName.english || data.applicantName.arabic;
      ctx.fillStyle = "#111827";
      ctx.font = "bold 64px 'Georgia', 'Times New Roman', serif";
      ctx.fillText(name || "—", cx, 545);

      // خط فاصل تحت الاسم
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 320, 575);
      ctx.lineTo(cx + 320, 575);
      ctx.stroke();

      // سطر القراءة
      ctx.fillStyle = "#334155";
      ctx.font = "26px Arial, 'Segoe UI', sans-serif";
      ctx.fillText(`${strings.forRecite} ${data.alQeratName || ""}`.trim(), cx, 640);

      // المُجيز
      const sheikh = (lang === "ar" ? data.sheikhName.arabic : data.sheikhName.english) || data.sheikhName.english || data.sheikhName.arabic;
      if (sheikh) {
        ctx.font = "bold 30px Arial, 'Segoe UI', sans-serif";
        ctx.fillStyle = "#0f766e";
        ctx.fillText(`${strings.instructor}: ${sheikh}`, cx, 710);
      }

      // التاريخ ورقم الشهادة
      const dateStr = new Date((data.dateOfIssue || 0) * 1000).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });
      ctx.font = "22px Arial, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(`${strings.date}: ${dateStr}    |    ${strings.no}: ${data.certificateId}`, cx, 770);

      // رمز QR للتحقق
      try {
        const verifyUrl = `${VERIFY_BASE}/${data.certificateId}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });
        const qrImg = await loadImage(qrDataUrl);
        ctx.drawImage(qrImg, cx - 75, 800, 150, 150);
        ctx.font = "16px Arial";
        ctx.fillStyle = "#64748b";
        ctx.fillText(verifyUrl, cx, 975);
      } catch {
        /* تجاهل فشل QR */
      }

      // تصدير إلى PNG ثم تغليفه في PDF
      const pngDataUrl = canvas.toDataURL("image/png");
      const pngBytes = Uint8Array.from(atob(pngDataUrl.split(",")[1]), (ch) => ch.charCodeAt(0));
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([canvas.width, canvas.height]);
      const png = await pdf.embedPng(pngBytes);
      page.drawImage(png, { x: 0, y: 0, width: canvas.width, height: canvas.height });
      const pdfBytes = await pdf.save();

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fatiha-Certificate-${data.certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setError(t("Operation failed"));
    } finally {
      setBusy(false);
    }
  }, [certificateId, lang, t]);

  return (
    <>
      <button type="button" className="btn btn-sm primary" onClick={build} disabled={busy}>
        <i className="fas fa-download me-1"></i>
        {busy ? t("Loading...") : t("Download")}
      </button>
      {error && <span className="text-danger small ms-2">{error}</span>}
    </>
  );
}
