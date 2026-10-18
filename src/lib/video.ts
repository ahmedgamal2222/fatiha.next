/**
 * أدوات الفيديو: تحويل أي رابط فيديو (يوتيوب · فيميو · منصّة أخرى · ملف مباشر)
 * إلى مصدر قابل للتشغيل داخل الصفحة، مع الحفاظ على الرابط الأصلي للفتح الخارجي.
 */

export type VideoKind = "youtube" | "vimeo" | "file" | "embed";

export interface ParsedVideo {
  kind: VideoKind;
  /** رابط التشغيل داخل الصفحة (embed أو ملف مباشر). */
  src: string;
  /** الرابط الأصلي كما أدخله الأدمن. */
  original: string;
  /** هل يحتاج إطار iframe بدل وسم video؟ */
  isFrame: boolean;
}

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DIRECT = /\.(mp4|webm|ogv|ogg|mov|m4v|3gp|mkv)(\?.*)?$/i;

export function parseVideoUrl(raw?: string | null): ParsedVideo | null {
  const original = (raw || "").trim();
  if (!original) return null;

  const yt = original.match(YT);
  if (yt) {
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1`,
      original,
      isFrame: true,
    };
  }

  const vimeo = original.match(VIMEO);
  if (vimeo) {
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`,
      original,
      isFrame: true,
    };
  }

  // منصّات شائعة أخرى — تُحوَّل إلى روابط تضمين رسمية
  const dailymotion = original.match(/dailymotion\.com\/video\/([a-z0-9]+)/i);
  if (dailymotion) {
    return { kind: "embed", src: `https://www.dailymotion.com/embed/video/${dailymotion[1]}`, original, isFrame: true };
  }

  const tiktok = original.match(/tiktok\.com\/.*\/video\/(\d+)/i);
  if (tiktok) {
    return { kind: "embed", src: `https://www.tiktok.com/embed/v2/${tiktok[1]}`, original, isFrame: true };
  }

  const instagram = original.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/i);
  if (instagram) {
    return { kind: "embed", src: `https://www.instagram.com/p/${instagram[1]}/embed`, original, isFrame: true };
  }

  const gdrive = original.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (gdrive) {
    return { kind: "embed", src: `https://drive.google.com/file/d/${gdrive[1]}/preview`, original, isFrame: true };
  }

  // فيسبوك: يحتاج الرابط الكامل مُرمَّزاً داخل plugins/video.php
  if (/facebook\.com|fb\.watch/i.test(original)) {
    return {
      kind: "embed",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(original)}&show_text=false&width=900`,
      original,
      isFrame: true,
    };
  }

  if (DIRECT.test(original)) {
    return { kind: "file", src: original, original, isFrame: false };
  }

  // أي رابط آخر (منصّة فيديو/استضافة) — نحاول تضمينه كإطار مع رابط احتياطي
  return { kind: "embed", src: original, original, isFrame: true };
}

/** هل الرابط ملف فيديو مباشر؟ */
export function isDirectVideo(url?: string | null): boolean {
  return !!url && DIRECT.test(url.trim());
}
