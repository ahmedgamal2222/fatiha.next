"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { MediaPicker } from "@/components/MediaPicker";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import type { Block, BlockType, FieldDef, PageDoc, RepeaterDef } from "@/lib/blocks";
import {
  DEFAULT_THEME,
  FIELDS,
  REPEATERS,
  STYLE_FIELDS,
  TEMPLATES,
  WIDGETS,
  blockFromAI,
  createBlock,
  docToText,
  parsePageDoc,
  serializePageDoc,
  uid,
} from "@/lib/blocks";

/**
 * محرّر الصفحات المرئي (Page Builder) — على طريقة Elementor:
 * مكتبة عناصر + أقسام جاهزة + سحب وإفلات + لوحة خصائص + معاينة أجهزة + تراجع/إعادة + توليد بالـAI.
 * الرابط: /admin/pages/builder?id=<رقم الصفحة>   (أو ?id=new لإنشاء صفحة)
 */

interface PageRow {
  id: number;
  title: string;
  content?: string | null;
  slug?: string | null;
  blocks?: string | null;
  coverImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isPublished?: boolean;
  languageId?: number;
}

/** أسماء اللغات بحسب EnumCommon.Languagelist (id == languageName). */
const LANG_NAMES: Record<number, string> = {
  1: "العربية", 2: "English", 3: "中文", 4: "Español", 5: "हिन्दी", 6: "Français",
  7: "Русский", 8: "বাংলা", 9: "Português", 10: "اردو", 11: "Bahasa Indonesia",
};
const LANG_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// ── مساعدات شجرة البلوكات (تدعم الأعمدة المتداخلة) ──

/** يمرّ على الشجرة ويطبّق دالة (تُرجع null لحذف البلوك). */
function mapTree(blocks: Block[], fn: (b: Block) => Block | null): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    const mapped = fn(b);
    if (!mapped) continue;
    if (mapped.type === "columns") {
      const props = { ...(mapped.props as Record<string, unknown>) };
      const cols = props.columns;
      if (Array.isArray(cols)) {
        props.columns = (cols as Block[][]).map((col) => mapTree(Array.isArray(col) ? col : [], fn));
      }
      out.push({ ...mapped, props });
    } else {
      out.push(mapped);
    }
  }
  return out;
}

/** يبحث عن بلوك في الشجرة. */
function findBlock(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.type === "columns") {
      const cols = (b.props as Record<string, unknown>).columns;
      if (Array.isArray(cols)) {
        for (const col of cols as Block[][]) {
          const found = findBlock(Array.isArray(col) ? col : [], id);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

/** يحرّك بلوكاً لأعلى/لأسفل داخل نفس القائمة (حتى لو كان داخل عمود). */
function moveInTree(blocks: Block[], id: string, dir: -1 | 1): Block[] {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx >= 0) {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return blocks;
    const copy = [...blocks];
    const tmp = copy[idx];
    copy[idx] = copy[j];
    copy[j] = tmp;
    return copy;
  }
  return blocks.map((b) => {
    if (b.type !== "columns") return b;
    const props = b.props as Record<string, unknown>;
    const cols = Array.isArray(props.columns) ? (props.columns as Block[][]) : [];
    return {
      ...b,
      props: { ...props, columns: cols.map((col) => moveInTree(Array.isArray(col) ? col : [], id, dir)) },
    };
  });
}

/** يضيف بلوكاً بجانب بلوك آخر (قبله/بعده)، وإن لم يُوجد يُضاف للنهاية. */
function insertInTree(blocks: Block[], nearId: string | null, block: Block, after = true): Block[] {
  if (!nearId) return [...blocks, block];
  const idx = blocks.findIndex((b) => b.id === nearId);
  if (idx >= 0) {
    const copy = [...blocks];
    copy.splice(after ? idx + 1 : idx, 0, block);
    return copy;
  }
  return blocks.map((b) => {
    if (b.type !== "columns") return b;
    const props = b.props as Record<string, unknown>;
    const cols = Array.isArray(props.columns) ? (props.columns as Block[][]) : [];
    return {
      ...b,
      props: { ...props, columns: cols.map((col) => insertInTree(Array.isArray(col) ? col : [], nearId, block, after)) },
    };
  });
}

// ── محرّرات الحقول ──

/** مفاتيح الحقول التي تُعرض بمنتقي وسائط (رفع من الجهاز + معاينة). */
const MEDIA_KEYS = ["src", "bgImage", "cover", "image", "imageUrl"];

/** حقل واحد في لوحة الخصائص حسب نوعه. */
function FieldInput({
  field,
  value,
  onChange,
  blockType,
  folder = "pages",
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  blockType?: BlockType;
  folder?: string;
}) {
  const { t } = useI18n();
  // حقول الوسائط: منتقي برفع من الجهاز + سحب وإفلات + معاينة
  const isVideoField = (blockType === "video" && field.key === "url") || field.key === "bgVideo";
  if (isVideoField || MEDIA_KEYS.includes(field.key)) {
    return (
      <MediaPicker
        value={String(value ?? "")}
        onChange={(v) => onChange(v)}
        folder={folder}
        kind={isVideoField ? "video" : "image"}
        previewHeight={130}
      />
    );
  }

  switch (field.type) {
    case "select":
      return (
        <select className="form-select form-select-sm" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {t(o.label)}
            </option>
          ))}
        </select>
      );
    case "toggle":
      return (
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        </div>
      );
    case "range":
      return (
        <div className="d-flex align-items-center gap-2">
          <input
            type="range"
            className="form-range"
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="badge bg-light text-dark">{String(value ?? 0)}</span>
        </div>
      );
    case "color":
      return (
        <div className="d-flex align-items-center gap-2">
          <input
            type="color"
            className="form-control form-control-color form-control-sm"
            value={/^#[0-9a-f]{6}$/i.test(String(value ?? "")) ? String(value) : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
          />
          <input className="form-control form-control-sm" dir="ltr" value={String(value ?? "")} placeholder="#000000" onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "textarea":
    case "html":
      return (
        <textarea
          className="form-control form-control-sm"
          rows={field.type === "html" ? 6 : 3}
          dir="auto"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={field.type === "html" ? { fontFamily: "monospace", fontSize: 12 } : undefined}
        />
      );
    default:
      return (
        <input
          className="form-control form-control-sm"
          dir="auto"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** محرّر العناصر المتكرّرة (نصوص/كائنات). */
function RepeaterEditor({
  def,
  items,
  onChange,
  folder = "pages",
  blockType,
}: {
  def: RepeaterDef;
  items: unknown;
  onChange: (next: unknown[]) => void;
  folder?: string;
  blockType?: BlockType;
}) {
  const { t } = useI18n();
  const list = Array.isArray(items) ? (items as Array<Record<string, unknown>>) : [];
  const add = () => onChange([...list, def.blank ? def.blank() : {}]);
  const remove = (i: number) => onChange(list.filter((_, k) => k !== i));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
    onChange(copy);
  };
  const setField = (i: number, key: string, val: unknown) =>
    onChange(list.map((it, k) => (k === i ? { ...(it ?? {}), [key]: val } : it)));

  return (
    <div className="d-grid gap-2">
      {list.map((item, i) => (
        <div key={i} className="border rounded-3 p-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-light text-dark">#{i + 1}</span>
            <div className="d-flex gap-1">
              <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-1" onClick={() => move(i, -1)} title={t("Move up")}>
                <i className="fas fa-arrow-up" />
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-1" onClick={() => move(i, 1)} title={t("Move down")}>
                <i className="fas fa-arrow-down" />
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => remove(i)} title={t("Delete block")}>
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
          {def.kind === "strings" ? (
            <MediaPicker
              value={String(item ?? "")}
              onChange={(v) => onChange(list.map((it, k) => (k === i ? v : it)))}
              folder={folder}
              previewHeight={110}
            />
          ) : (
            <div className="d-grid gap-2">
              {(def.fields ?? []).map((f) => (
                <div key={f.key}>
                  <label className="form-label small mb-1 text-muted">{t(f.label)}</label>
                  <FieldInput field={f} value={(item ?? {})[f.key]} onChange={(val) => setField(i, f.key, val)} folder={folder} blockType={blockType} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button type="button" className="btn btn-sm btn-outline-primary" onClick={add}>
        <i className="fas fa-plus me-1" />
        {def.label}
      </button>
    </div>
  );
}

// ─────────────────────────── المحرّر ───────────────────────────

function BuilderInner() {
  const { t } = useI18n();
  const search = useSearchParams();
  const idParam = search.get("id") ?? "new";

  const [pageId, setPageId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [cover, setCover] = useState("");
  const [published, setPublished] = useState(true);
  const [languageId, setLanguageId] = useState(1);
  const [doc, setDoc] = useState<PageDoc>({ version: 1, theme: { ...DEFAULT_THEME }, blocks: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [rightTab, setRightTab] = useState<"element" | "style" | "page" | "theme">("element");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiBlockPrompt, setAiBlockPrompt] = useState("");
  const [aiBlockBusy, setAiBlockBusy] = useState(false);
  /** محتوى صفحة قديمة (HTML/نص) لم يُحوَّل بعد إلى بلوكات. */
  const [legacy, setLegacy] = useState<string | null>(null);

  const history = useRef<PageDoc[]>([]);
  const future = useRef<PageDoc[]>([]);
  const dragId = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => (selectedId ? findBlock(doc.blocks, selectedId) : null), [doc, selectedId]);

  /** يحدّث المستند مع حفظ نقطة تراجع. */
  const commit = useCallback((updater: (d: PageDoc) => PageDoc) => {
    setDoc((prev) => {
      history.current = [...history.current.slice(-49), prev];
      future.current = [];
      return updater(prev);
    });
  }, []);

  const undo = useCallback(() => {
    setDoc((prev) => {
      const h = history.current;
      if (!h.length) return prev;
      const last = h[h.length - 1];
      history.current = h.slice(0, -1);
      future.current = [prev, ...future.current].slice(0, 50);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setDoc((prev) => {
      const f = future.current;
      if (!f.length) return prev;
      const first = f[0];
      future.current = f.slice(1);
      history.current = [...history.current, prev];
      return first;
    });
  }, []);

  // ── تحميل الصفحة ──
  useEffect(() => {
    if (idParam === "new") {
      setLoading(false);
      return;
    }
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      setErr(t("Not found"));
      setLoading(false);
      return;
    }
    api
      .get<PageRow>(`/api/pages/admin/${id}`)
      .then((r) => {
        const p = r.data;
        if (!p) return;
        setPageId(p.id);
        setTitle(p.title ?? "");
        setSlug(p.slug ?? "");
        setSeoTitle(p.seoTitle ?? "");
        setSeoDesc(p.seoDescription ?? "");
        setCover(p.coverImage ?? "");
        setPublished(p.isPublished !== false);
        setLanguageId(p.languageId ?? 1);
        setDoc(parsePageDoc(p.blocks));
        if (!p.blocks) setLegacy(p.content ?? null);
      })
      .catch(() => setErr(t("Operation failed")))
      .finally(() => setLoading(false));
  }, [idParam, t]);

  // ── عمليات البلوكات ──
  const addBlock = useCallback(
    (block: Block, afterId: string | null = selectedId) => {
      commit((d) => ({ ...d, blocks: insertInTree(d.blocks, afterId, block, true) }));
      setSelectedId(block.id);
      setRightTab("element");
    },
    [commit, selectedId]
  );

  const removeBlock = useCallback(
    (id: string) => {
      commit((d) => ({ ...d, blocks: mapTree(d.blocks, (b) => (b.id === id ? null : b)) }));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit]
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const src = findBlock(doc.blocks, id);
      if (!src) return;
      const copy: Block = { ...src, id: uid() };
      commit((d) => ({ ...d, blocks: insertInTree(d.blocks, id, copy, true) }));
      setSelectedId(copy.id);
    },
    [commit, doc.blocks]
  );

  const moveBlock = useCallback(
    (id: string, dir: -1 | 1) => commit((d) => ({ ...d, blocks: moveInTree(d.blocks, id, dir) })),
    [commit]
  );

  const updateProps = useCallback(
    (id: string, key: string, value: unknown) => {
      commit((d) => ({
        ...d,
        blocks: mapTree(d.blocks, (b) =>
          b.id === id ? { ...b, props: { ...(b.props as Record<string, unknown>), [key]: value } } : b
        ),
      }));
    },
    [commit]
  );

  const updateTheme = useCallback(
    (key: string, value: unknown) => commit((d) => ({ ...d, theme: { ...d.theme, [key]: value } })),
    [commit]
  );

  /** يحدّث خاصية تنسيق (Style) للبلوك — خلفية/أبعاد/محاذاة/حركة. */
  const updateStyle = useCallback(
    (id: string, key: string, value: unknown) => {
      commit((d) => ({
        ...d,
        blocks: mapTree(d.blocks, (b) =>
          b.id === id ? { ...b, style: { ...((b.style ?? {}) as Record<string, unknown>), [key]: value } } : b
        ),
      }));
    },
    [commit]
  );

  /** إعادة الترتيب بالسحب والإفلات (البلوكات الجذرية). */
  const onDrop = useCallback(
    (targetId: string) => {
      const from = dragId.current;
      dragId.current = null;
      if (!from || from === targetId) return;
      commit((d) => {
        const src = d.blocks.find((b) => b.id === from);
        if (!src) return d;
        const without = d.blocks.filter((b) => b.id !== from);
        const idx = without.findIndex((b) => b.id === targetId);
        const next = [...without];
        next.splice(idx < 0 ? without.length : idx, 0, src);
        return { ...d, blocks: next };
      });
    },
    [commit]
  );

  /**
   * يُفعّل السحب والإفلات على البلوكات الجذرية في لوحة الرسم
   * (العارض يضع data-block-id على البلوكات الجذرية فقط).
   */
  useEffect(() => {
    const root = canvasRef.current;
    if (!root || preview) return;
    const cleanups: Array<() => void> = [];
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-block-id]"));
    for (const el of nodes) {
      const id = el.dataset.blockId;
      if (!id) continue;
      const onDragStart = (ev: DragEvent) => {
        dragId.current = id;
        try { ev.dataTransfer?.setData("text/plain", id); } catch { /* تجاهل */ }
      };
      const onDragOverEl = (ev: DragEvent) => {
        ev.preventDefault();
        el.style.boxShadow = "inset 0 0 0 2px rgba(11,122,110,0.6)";
      };
      const onDragLeaveEl = () => { el.style.boxShadow = "none"; };
      const onDropEl = (ev: DragEvent) => {
        ev.preventDefault();
        el.style.boxShadow = "none";
        onDrop(id);
      };
      el.setAttribute("draggable", "true");
      el.addEventListener("dragstart", onDragStart);
      el.addEventListener("dragover", onDragOverEl);
      el.addEventListener("dragleave", onDragLeaveEl);
      el.addEventListener("drop", onDropEl);
      cleanups.push(() => {
        el.removeEventListener("dragstart", onDragStart);
        el.removeEventListener("dragover", onDragOverEl);
        el.removeEventListener("dragleave", onDragLeaveEl);
        el.removeEventListener("drop", onDropEl);
      });
    }
    return () => cleanups.forEach((off) => off());
  }, [doc, preview, onDrop]);

  // ── الحفظ ──
  async function save(publishOverride?: boolean) {
    if (!title.trim()) {
      setErr(t("Title is required"));
      return;
    }
    setSaving(true);
    setMsg("");
    setErr("");
    const payload: Record<string, unknown> = {
      title: title.trim(),
      blocks: serializePageDoc(doc),
      content: docToText(doc) || title.trim(),
      isPublished: publishOverride ?? published,
      languageId,
    };
    if (slug.trim()) payload.slug = slug.trim();
    if (cover.trim()) payload.coverImage = cover.trim();
    if (seoTitle.trim()) payload.seoTitle = seoTitle.trim();
    if (seoDesc.trim()) payload.seoDescription = seoDesc.trim();

    try {
      if (pageId) {
        await api.put(`/api/pages/${pageId}`, payload);
      } else {
        const r = await api.post<PageRow>("/api/pages", payload);
        if (r.data?.id) setPageId(r.data.id);
        if (r.data?.slug) setSlug(r.data.slug);
      }
      if (publishOverride !== undefined) setPublished(publishOverride);
      setMsg(t("Saved"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Operation failed"));
    } finally {
      setSaving(false);
    }
  }

  // ── التوليد بالـAI ──
  async function generatePage() {
    if (aiPrompt.trim().length < 3) return;
    setAiBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await api.post<{ title: string; seoDescription: string; blocks: unknown[] }>("/api/pages/generate", {
        prompt: aiPrompt.trim(),
        languageId,
      });
      const blocks = (r.data?.blocks ?? []).map(blockFromAI).filter(Boolean) as Block[];
      if (!blocks.length) throw new Error(t("AI generation failed"));
      commit((d) => ({ ...d, blocks: [...d.blocks, ...blocks] }));
      if (!title.trim() && r.data?.title) setTitle(r.data.title);
      if (!seoDesc.trim() && r.data?.seoDescription) setSeoDesc(r.data.seoDescription);
      setMsg(t("Page generated"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("AI generation failed"));
    } finally {
      setAiBusy(false);
    }
  }

  /** ترجمة الصفحة كاملة إلى لغات أخرى بالذكاء الاصطناعي (يُنشئ نسخة لكل لغة). */
  async function translatePage() {
    if (!pageId) {
      setErr(t("Save the page first"));
      return;
    }
    if (!doc.blocks.length) {
      setErr(t("Add block"));
      return;
    }
    setAiBusy(true);
    setErr("");
    setMsg("");
    try {
      await save();
      const r = await api.post<{ pages?: unknown[]; failed?: number[] }>(`/api/pages/${pageId}/translate`, {});
      const n = Array.isArray(r.data?.pages) ? r.data.pages.length : 0;
      setMsg(`${t("Translated")}: ${n}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("AI generation failed"));
    } finally {
      setAiBusy(false);
    }
  }

  /** تحويل صفحة قديمة (HTML) إلى بلوكات قابلة للتحرير بصرياً. */
  async function convertLegacy() {
    if (!pageId) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const r = await api.post<{ blocks?: string | null }>(`/api/pages/${pageId}/convert`, {});
      setDoc(parsePageDoc(r.data?.blocks));
      setLegacy(null);
      setMsg(t("Page converted"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Operation failed"));
    } finally {
      setSaving(false);
    }
  }

  /** تحسين البلوك المحدَّد بالذكاء الاصطناعي (يملأ خصائصه من وصف قصير). */
  async function aiImproveBlock() {
    if (!selected || aiBlockPrompt.trim().length < 2) return;
    const target = selected;
    setAiBlockBusy(true);
    setErr("");
    try {
      const r = await api.post<{ type: string; props: Record<string, unknown> }>("/api/pages/ai-block", {
        type: target.type,
        prompt: aiBlockPrompt.trim(),
        languageId,
      });
      const props = r.data?.props;
      if (props) {
        commit((d) => ({
          ...d,
          blocks: mapTree(d.blocks, (b) =>
            b.id === target.id ? { ...b, props: { ...(b.props as Record<string, unknown>), ...props } } : b
          ),
        }));
        setMsg(t("Generated with AI"));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("AI generation failed"));
    } finally {
      setAiBlockBusy(false);
    }
  }

  const frameWidth = device === "mobile" ? 390 : device === "tablet" ? 780 : 1200;

  if (loading) return <div className="p-5 text-center text-muted">{t("Loading...")}</div>;

  return (
    <div className="bz-scope">
      {/* ── الشريط العلوي ── */}
      <div className="bz-top">
        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/pages" className="btn btn-sm btn-light" title={t("Exit")}>
            <i className="fas fa-arrow-right" />
          </Link>
          <input
            className="form-control form-control-sm bz-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("Page title")}
          />
          <span className={`bz-badge badge ${published ? "bg-success" : "bg-secondary"}`}>
            {published ? t("Published") : t("Draft")}
          </span>
        </div>

        <div className="btn-group btn-group-sm">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn-outline-secondary ${device === d ? "active" : ""}`}
              onClick={() => setDevice(d)}
              title={t(d === "desktop" ? "Desktop" : d === "tablet" ? "Tablet" : "Mobile")}
            >
              <i className={`fas ${d === "desktop" ? "fa-desktop" : d === "tablet" ? "fa-tablet-screen-button" : "fa-mobile-screen"}`} />
            </button>
          ))}
        </div>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={undo} title={t("Undo")}>
            <i className="fas fa-rotate-left" />
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={redo} title={t("Redo")}>
            <i className="fas fa-rotate-right" />
          </button>
          <button
            type="button"
            className={`btn btn-sm ${preview ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setPreview((v) => !v)}
          >
            <i className="fas fa-eye me-1" />
            {t("Preview")}
          </button>
          {pageId ? (
            <a className="btn btn-sm btn-outline-primary" href={`/page/view?id=${pageId}`} target="_blank" rel="noreferrer">
              <i className="fas fa-up-right-from-square me-1" />
              {t("View page")}
            </a>
          ) : null}
          <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={() => save()}>
            {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-floppy-disk me-2" />}
            {t("Save")}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${published ? "btn-outline-secondary" : "btn-success"}`}
            disabled={saving}
            onClick={() => save(!published)}
          >
            <i className={`fas ${published ? "fa-eye-slash" : "fa-rocket"} me-1`} />
            {published ? t("Unpublish") : t("Publish")}
          </button>
        </div>
      </div>

      {(msg || err) && (
        <div className="px-3 pt-2">
          {msg && <div className="alert alert-success py-2 rounded-3 mb-2">{msg}</div>}
          {err && <div className="alert alert-danger py-2 rounded-3 mb-0">{err}</div>}
        </div>
      )}

      <div className="d-flex align-items-stretch" style={{ alignItems: "flex-start" }}>
        {/* ── اللوحة الأولى: العناصر والأقسام والتوليد بالـAI ── */}
        <aside className="bz-side">
          <div className="p-3">
            <label className="form-label small fw-bold mb-1">
              <i className="fas fa-wand-magic-sparkles me-1 text-primary" />
              {t("Generate page with AI")}
            </label>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={t("Describe the page you want…")}
            />
            <button type="button" className="btn btn-sm btn-primary w-100 mt-2" disabled={aiBusy} onClick={generatePage}>
              {aiBusy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-bolt me-1" />}
              {aiBusy ? t("AI is writing…") : t("Generate")}
            </button>
            <button type="button" className="btn btn-sm btn-outline-primary w-100 mt-2" disabled={aiBusy || !pageId} onClick={translatePage}>
              <i className="fas fa-language me-1" />
              {t("Translate to 11 languages")}
            </button>
            <div className="form-text">{t("Creates a copy of this page in every language.")}</div>
          </div>

          <div className="p-3">
            <h6 className="bz-sec-title mb-2">{t("Widgets")}</h6>
            {(["pro", "basic", "media", "layout"] as const).map((group) => (
              <div key={group} className="mb-3">
                <div className="bz-sec-title mb-1">
                  {t(group === "pro" ? "Pro widgets" : group === "basic" ? "Basic" : group === "media" ? "Media" : "Layout")}
                </div>
                <div className="bz-widgets">
                  {WIDGETS.filter((w) => w.group === group).map((w) => (
                    <button
                      key={w.type}
                      type="button"
                      className={`bz-widget${w.group === "pro" ? " bz-widget--pro" : ""}`}
                      onClick={() => addBlock(createBlock(w.type))}
                      title={t(w.label)}
                    >
                      <i className={`fas ${w.icon}`} />
                      <span>{t(w.label)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <h6 className="bz-sec-title">{t("Sections")}</h6>
            <div className="bz-sections">
              {TEMPLATES.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className="bz-sec"
                  onClick={() => {
                    const created = sec.build();
                    commit((d) => ({ ...d, blocks: [...d.blocks, ...created] }));
                    setSelectedId(created[0]?.id ?? null);
                  }}
                >
                  <i className={`fas ${sec.icon} me-1 text-primary`} />
                  <span className="small">{t(sec.label)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── اللوحة الوسطى: لوحة الرسم ── */}
        <main className="bz-canvas" onClick={() => setSelectedId(null)}>
          <div style={{ maxWidth: frameWidth }}>
            {legacy ? (
              <div className="alert alert-warning rounded-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="small">
                  <i className="fas fa-wand-magic-sparkles me-2" />
                  {t("This page has old HTML content. Convert it to blocks to edit it visually.")}
                </div>
                <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={convertLegacy}>
                  <i className="fas fa-wand-magic-sparkles me-1" />
                  {t("Convert to blocks")}
                </button>
              </div>
            ) : null}
            <div className={`bz-frame${preview ? " bz-frame--preview" : ""}`} style={{ background: doc.theme.bg }}>
              <div ref={canvasRef} onClick={(e) => e.stopPropagation()}>
                <BlockRenderer doc={doc} editable={!preview} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
            </div>
          </div>
        </main>

        {/* ── اللوحة الثالثة: الخصائص ── */}
        <aside className="bz-side bz-side--right">
          <div className="bz-tabs">
            {(["element", "style", "page", "theme"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`bz-tab${rightTab === tab ? " bz-tab--on" : ""}`}
                onClick={() => setRightTab(tab)}
              >
                <i className={`fas ${tab === "element" ? "fa-sliders" : tab === "style" ? "fa-palette" : tab === "page" ? "fa-file-lines" : "fa-swatchbook"} me-1`} />
                {t(tab === "element" ? "Element" : tab === "style" ? "Style" : tab === "page" ? "Page" : "Theme")}
              </button>
            ))}
          </div>

          <div className="bz-panel-body">
            {rightTab === "element" &&
              (!selected ? (
                <p className="text-muted small mb-0">{t("Select a block to edit its properties")}</p>
              ) : (
                <>
                  <div className="bz-element-head">
                    <span className="bz-chip">
                      {t(WIDGETS.find((w) => w.type === selected.type)?.label ?? selected.type)}
                    </span>
                    <div className="btn-group btn-group-sm bz-toolbar">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => moveBlock(selected.id, -1)} title={t("Move up")}>
                        <i className="fas fa-arrow-up" />
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => moveBlock(selected.id, 1)} title={t("Move down")}>
                        <i className="fas fa-arrow-down" />
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => duplicateBlock(selected.id)} title={t("Duplicate")}>
                        <i className="fas fa-copy" />
                      </button>
                      <button type="button" className="btn btn-outline-danger" onClick={() => removeBlock(selected.id)} title={t("Delete block")}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>

                  <div className="d-grid gap-3">
                    {(FIELDS[selected.type] ?? [])
                      .filter((f) => !(REPEATERS[selected.type] ?? []).some((r) => r.key === f.key))
                      .map((f) => (
                        <div key={f.key}>
                          <label className="bz-label">{t(f.label)}</label>
                          <FieldInput
                            field={f}
                            value={(selected.props as Record<string, unknown>)[f.key]}
                            onChange={(val) => updateProps(selected.id, f.key, val)}
                            blockType={selected.type}
                            folder="pages"
                          />
                        </div>
                      ))}
                  </div>

                  {(REPEATERS[selected.type] ?? [])
                    .filter((r) => r.kind !== "blocks")
                    .map((r) => (
                      <div key={r.key} className="mt-3">
                        <label className="bz-label">{t(r.label)}</label>
                        <RepeaterEditor
                          def={r}
                          items={(selected.props as Record<string, unknown>)[r.key]}
                          onChange={(next) => updateProps(selected.id, r.key, next)}
                          folder="pages"
                          blockType={selected.type}
                        />
                      </div>
                    ))}

                  <div className="bz-ai mt-3">
                    <label className="bz-label">
                      <i className="fas fa-wand-magic-sparkles me-1 text-primary" />
                      {t("Improve with AI")}
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={aiBlockPrompt}
                      onChange={(e) => setAiBlockPrompt(e.target.value)}
                      placeholder={t("Describe what you want…")}
                    />
                    <button type="button" className="btn btn-sm btn-outline-primary w-100 mt-2" disabled={aiBlockBusy} onClick={aiImproveBlock}>
                      {aiBlockBusy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-bolt me-1" />}
                      {t("Improve with AI")}
                    </button>
                  </div>
                </>
              ))}


            {/* محرّر الأعمدة — بلوكات متداخلة داخل كل عمود */}
            {rightTab === "element" && selected && selected.type === "columns" && (() => {
              const cols = (((selected.props as Record<string, unknown>).columns as Block[][]) ?? []).map((c) =>
                Array.isArray(c) ? c : []
              );
              const apply = (next: Block[][]) => updateProps(selected.id, "columns", next);
              const addColBlock = (ci: number, type: BlockType) => {
                const next = cols.map((c) => [...c]);
                const block = createBlock(type);
                next[ci] = [...(next[ci] ?? []), block];
                apply(next);
                setSelectedId(block.id);
              };
              const addCol = (ci: number) => {
                const next = cols.map((c) => [...c]);
                next.splice(ci + 1, 0, []);
                apply(next);
              };
              const delCol = (ci: number) => {
                if (cols.length <= 1) return;
                apply(cols.filter((_, k) => k !== ci));
              };

              return (
              <div className="mt-4 pt-3 border-top">
                  <label className="bz-label fw-bold mb-2">{t("Columns")}</label>
                  <div className="d-grid gap-2">
                    {cols.map((col, ci) => (
                      <div key={ci} className="border rounded-3 p-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-light text-dark">
                            {t("Column")} {ci + 1}
                          </span>
                          <div className="btn-group btn-group-sm">
                            <button type="button" className="btn btn-outline-secondary py-0 px-1" onClick={() => addCol(ci)} title={t("Add column")}>
                              <i className="fas fa-plus" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger py-0 px-1"
                              onClick={() => delCol(ci)}
                              disabled={cols.length <= 1}
                              title={t("Delete block")}
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </div>

                        <div className="d-grid gap-1 mb-2">
                          {col.length === 0 ? <div className="small text-muted">{t("Empty column")}</div> : null}
                          {col.map((child) => (
                            <div
                              key={child.id}
                              className={`d-flex align-items-center justify-content-between border rounded-2 px-2 py-1 ${selectedId === child.id ? "border-primary" : ""}`}
                            >
                              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setSelectedId(child.id)}>
                                <i className="fas fa-cube me-1 text-muted" />
                                <span className="small">{t(WIDGETS.find((w) => w.type === child.type)?.label ?? child.type)}</span>
                              </button>
                              <div className="btn-group btn-group-sm">
                                <button type="button" className="btn btn-outline-secondary py-0 px-1" onClick={() => moveBlock(child.id, -1)}>
                                  <i className="fas fa-arrow-up" />
                                </button>
                                <button type="button" className="btn btn-outline-secondary py-0 px-1" onClick={() => moveBlock(child.id, 1)}>
                                  <i className="fas fa-arrow-down" />
                                </button>
                                <button type="button" className="btn btn-outline-danger py-0 px-1" onClick={() => removeBlock(child.id)}>
                                  <i className="fas fa-trash" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <select
                          className="form-select form-select-sm"
                          value=""
                          onChange={(e) => {
                            const val = e.target.value as BlockType;
                            if (val) addColBlock(ci, val);
                            e.target.value = "";
                          }}
                        >
                          <option value="">{t("Add block to column")}</option>
                          {WIDGETS.map((w) => (
                            <option key={w.type} value={w.type}>
                              {t(w.label)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}


            {/* ── تنسيق القسم (Style) ── */}
            {rightTab === "style" &&
              (!selected ? (
                <p className="text-muted small mb-0">{t("Select a block to edit its properties")}</p>
              ) : (
                <>
                  <div className="bz-element-head">
                    <span className="bz-chip">{t("Section style")}</span>
                    <div className="btn-group btn-group-sm bz-toolbar">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => moveBlock(selected.id, -1)} title={t("Move up")}>
                        <i className="fas fa-arrow-up" />
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => moveBlock(selected.id, 1)} title={t("Move down")}>
                        <i className="fas fa-arrow-down" />
                      </button>
                      <button type="button" className="btn btn-outline-danger" onClick={() => removeBlock(selected.id)} title={t("Delete block")}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>

                  <div className="d-grid gap-3">
                    {STYLE_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="bz-label">{t(f.label)}</label>
                        <FieldInput
                          field={f}
                          value={((selected.style ?? {}) as Record<string, unknown>)[f.key]}
                          onChange={(val) => updateStyle(selected.id, f.key, val)}
                          blockType={selected.type}
                          folder="pages"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bz-group mt-3">
                    <div className="bz-label mb-1">{t("Quick backgrounds")}</div>
                    <div className="d-flex flex-wrap gap-1">
                      {[
                        { label: t("Soft"), bg: "#f8fafc" },
                        { label: t("Dark"), bg: "#0f172a" },
                        { label: t("Primary"), bg: "#0b7a6e" },
                        { label: t("Accent"), bg: "#e9a319" },
                        { label: t("Muted"), bg: "#eef2f4" },
                      ].map((q) => (
                        <button
                          key={q.bg}
                          type="button"
                          className="btn btn-sm border"
                          style={{ background: q.bg, color: "#334155", fontSize: 11 }}
                          onClick={() => updateStyle(selected.id, "bg", q.bg)}
                        >
                          {q.label}
                        </button>
                      ))}
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => updateStyle(selected.id, "bg", "")}>
                        <i className="fas fa-xmark" />
                      </button>
                    </div>
                  </div>
                </>
              ))}

            {/* ── إعدادات الصفحة ── */}
            {rightTab === "page" && (
              <div className="d-grid gap-3">
                <div>
                  <label className="form-label small mb-1 text-muted">{t("Title")}</label>
                  <input className="form-control form-control-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small mb-1 text-muted">{t("Slug")}</label>
                  <input className="form-control form-control-sm" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-us" />
                </div>
                <div>
                  <label className="form-label small mb-1 text-muted">{t("Language")}</label>
                  <select className="form-select form-select-sm" value={languageId} onChange={(e) => setLanguageId(Number(e.target.value))}>
                    {LANG_IDS.map((id) => (
                      <option key={id} value={id}>
                        {LANG_NAMES[id]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label small mb-1 text-muted">{t("Cover URL")}</label>
                  <input className="form-control form-control-sm" dir="ltr" value={cover} onChange={(e) => setCover(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small mb-1 text-muted">{t("SEO title")}</label>
                  <input className="form-control form-control-sm" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small mb-1 text-muted">{t("SEO description")}</label>
                  <textarea className="form-control form-control-sm" rows={3} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="pubSwitch" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                  <label className="form-check-label small" htmlFor="pubSwitch">
                    {t("Published")}
                  </label>
                </div>
                <div className="alert alert-light border small mb-0">
                  <i className="fas fa-link me-1" />
                  {t("Public link")}: <code dir="ltr">/page/view?slug={slug || "…"}</code>
                </div>
              </div>
            )}

            {/* ── الثيم ── */}
            {rightTab === "theme" && (
              <div className="d-grid gap-3">
                {([
                  ["primary", "Primary color"],
                  ["accent", "Accent color"],
                  ["text", "Text color"],
                  ["bg", "Background"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="form-label small mb-1 text-muted">{t(label)}</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        className="form-control form-control-color form-control-sm"
                        value={String(doc.theme[key])}
                        onChange={(e) => updateTheme(key, e.target.value)}
                      />
                      <input
                        className="form-control form-control-sm"
                        dir="ltr"
                        value={String(doc.theme[key])}
                        onChange={(e) => updateTheme(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="form-label small mb-1 text-muted">{t("Radius")}</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="range"
                      className="form-range"
                      min={0}
                      max={40}
                      step={2}
                      value={Number(doc.theme.radius)}
                      onChange={(e) => updateTheme("radius", Number(e.target.value))}
                    />
                    <span className="badge bg-light text-dark">{doc.theme.radius}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function PageBuilderPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<div className="p-5 text-center text-muted">…</div>}>
        <BuilderInner />
      </Suspense>
    </AdminGuard>
  );
}
