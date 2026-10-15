"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Block, PageDoc } from "@/lib/blocks";

/**
 * عارض البلوكات — يُستخدم في الصفحة العامة وللمعاينة داخل المحرّر.
 * كل الأنماط inline مبنية على `theme` الخاص بالصفحة، فلا يحتاج أي CSS خارجي.
 */

export interface RendererProps {
  doc: PageDoc;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/** يحوّل رابط يوتيوب/فيميو إلى رابط تشغيل مضمّن. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/i);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

const alignToFlex = (a?: string) => (a === "center" ? "center" : a === "end" ? "flex-end" : "flex-start");
const alignToText = (a?: string): CSSProperties["textAlign"] => (a === "center" ? "center" : a === "end" ? "end" : "start");

const WRAP: CSSProperties = { maxWidth: 1140, margin: "0 auto", padding: "0 16px" };

/** صورة مع بديل بصري عند غياب الرابط. */
function Img({ src, alt, style, editable }: { src?: string; alt?: string; style?: CSSProperties; editable?: boolean }) {
  if (!src) {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          background: "rgba(11,122,110,0.07)",
          border: "1px dashed rgba(11,122,110,0.35)",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        <i className="fas fa-image me-2" />
        {editable ? "Image URL" : ""}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? ""} style={style} loading="lazy" />;
}

/** زر بعرض/لون حسب النمط (primary/outline) ويدعم الخلفيات الداكنة. */
function Btn({ label, href, variant, size, onDark }: { label?: string; href?: string; variant?: string; size?: string; onDark?: boolean }) {
  if (!label) return null;
  const pad = size === "sm" ? "8px 16px" : size === "lg" ? "16px 34px" : "12px 26px";
  const fs = size === "sm" ? 14 : size === "lg" ? 18 : 16;
  const cls = variant === "outline" ? (onDark ? "btn btn-outline-light" : "btn btn-outline-primary") : "btn btn-primary";
  return (
    <a href={href || "#"} className={cls} style={{ padding: pad, fontSize: fs, borderRadius: 999, fontWeight: 700 }}>
      {label}
    </a>
  );
}


/** يرسم البلوكات البسيطة (عنوان/نص/زر/فاصل/مسافة/صورة/قائمة/HTML). */
function SimpleBlock({ block, theme, editable }: { block: Block; theme: PageDoc["theme"]; editable?: boolean }): React.ReactElement | null {
  const p = (block.props ?? {}) as Record<string, any>;
  const radius = Number(p.radius ?? theme.radius);

  switch (block.type) {
    case "heading": {
      const level = Number(p.level ?? 2);
      const style: CSSProperties = { margin: 0, textAlign: alignToText(p.align), color: p.color || theme.text, fontWeight: 800 };
      const text = String(p.text ?? "");
      if (level === 1) return <div style={{ padding: "32px 0" }}><div style={WRAP}><h1 style={style}>{text}</h1></div></div>;
      if (level === 3) return <div style={{ padding: "24px 0" }}><div style={WRAP}><h3 style={style}>{text}</h3></div></div>;
      if (level === 4) return <div style={{ padding: "20px 0" }}><div style={WRAP}><h4 style={style}>{text}</h4></div></div>;
      return <div style={{ padding: "28px 0" }}><div style={WRAP}><h2 style={style}>{text}</h2></div></div>;
    }
    case "text":
      return (
        <div style={{ padding: "18px 0" }}>
          <div style={{ ...WRAP, textAlign: alignToText(p.align), color: p.color || theme.text }} dangerouslySetInnerHTML={{ __html: String(p.html ?? "") }} />
        </div>
      );
    case "button":
      return (
        <div style={{ padding: "14px 0" }}>
          <div style={{ ...WRAP, display: "flex", justifyContent: alignToFlex(p.align) }}>
            <Btn label={p.label} href={p.href} variant={p.variant} size={p.size} />
          </div>
        </div>
      );
    case "divider":
      return (
        <div style={{ padding: "18px 0" }}>
          <div style={{ ...WRAP, display: "flex", justifyContent: "center" }}>
            <hr style={{ width: `${Number(p.width ?? 100)}%`, borderTop: `2px ${p.style ?? "solid"} ${p.color || "rgba(15,23,42,0.12)"}`, margin: 0 }} />
          </div>
        </div>
      );
    case "spacer":
      return <div style={{ height: Number(p.height ?? 48) }} />;
    case "html":
      return <div style={{ padding: "44px 0" }}><div style={WRAP} dangerouslySetInnerHTML={{ __html: String(p.code ?? "") }} /></div>;
    case "image":
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={{ ...WRAP, display: "flex", flexDirection: "column", alignItems: alignToFlex(p.align) }}>
            <div style={{ width: `${Number(p.width ?? 100)}%`, maxWidth: "100%" }}>
              <Img src={p.src} alt={p.alt} editable={editable} style={{ width: "100%", borderRadius: radius, objectFit: "cover", display: "block" }} />
              {p.caption ? <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 8 }}>{p.caption}</div> : null}
            </div>
          </div>
        </div>
      );
    case "list": {
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, any>>) : [];
      return (
        <div style={{ padding: "22px 0" }}>
          <div style={WRAP}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {items.map((it, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: theme.text }}>
                  <i className={`fas ${it.icon || "fa-check"}`} style={{ color: theme.primary, marginTop: 4 }} />
                  <span>{it.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

/** سلايدر الهيرو — مكوّن مستقل لأنه يستخدم حالة (سلايد حالي/تشغيل تلقائي). */
function HeroSlider({ block, theme }: { block: Block; theme: PageDoc["theme"] }) {
  const p = (block.props ?? {}) as Record<string, any>;
  const slides = Array.isArray(p.slides) ? (p.slides as Array<Record<string, any>>) : [];
  const n = slides.length;
  const [i, setI] = useState(0);
  const autoplay = p.autoplay !== false;

  useEffect(() => {
    if (!autoplay || n < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(id);
  }, [autoplay, n]);

  if (!n) {
    return (
      <div style={{ padding: "70px 16px", textAlign: "center", color: "#94a3b8", background: "rgba(11,122,110,0.05)" }}>
        <i className="fas fa-sliders fa-2x mb-3" />
        <p className="mb-0">Add slides…</p>
      </div>
    );
  }

  const current = slides[Math.min(i, n - 1)];
  const bg = current.image
    ? `linear-gradient(135deg, rgba(9,20,38,0.25), rgba(9,20,38,0.25)), url(${current.image}) center/cover no-repeat`
    : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`;

  return (
    <section style={{ position: "relative", minHeight: p.height || "520px", display: "flex", alignItems: "center", background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(9,20,38,${Number(p.overlay ?? 0.45)})` }} />
      <div style={{ ...WRAP, position: "relative", textAlign: "center", color: "#ffffff", padding: "96px 16px", width: "100%" }}>
        <h1 style={{ fontWeight: 900, margin: 0, lineHeight: 1.2 }}>{current.title}</h1>
        {current.subtitle ? <p style={{ opacity: 0.92, marginTop: 14, fontSize: 18 }}>{current.subtitle}</p> : null}
        {current.buttonLabel ? <div style={{ marginTop: 22 }}><Btn label={current.buttonLabel} href={current.buttonHref} onDark /></div> : null}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="btn btn-sm btn-outline-light"
            onClick={() => setI((v) => (v - 1 + n) % n)}
            style={{ position: "absolute", insetInlineStart: 18, top: "50%", transform: "translateY(-50%)" }}
          >
            <i className="fas fa-chevron-right" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="btn btn-sm btn-outline-light"
            onClick={() => setI((v) => (v + 1) % n)}
            style={{ position: "absolute", insetInlineEnd: 18, top: "50%", transform: "translateY(-50%)" }}
          >
            <i className="fas fa-chevron-left" />
          </button>
          <div style={{ position: "absolute", bottom: 18, insetInline: 0, display: "flex", gap: 8, justifyContent: "center" }}>
            {slides.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Slide ${k + 1}`}
                onClick={() => setI(k)}
                style={{ width: 10, height: 10, borderRadius: 999, border: "none", background: k === i ? "#ffffff" : "rgba(255,255,255,0.5)" }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}



/** يرسم البلوكات الغنية (Hero · CTA · اقتباس · بطاقات · عدّادات · معرض · لوجو · فيديو · FAQ). */
function RichBlock({ block, theme, editable }: { block: Block; theme: PageDoc["theme"]; editable?: boolean }): React.ReactElement | null {
  const p = (block.props ?? {}) as Record<string, any>;
  const radius = Number(p.radius ?? theme.radius);

  if (block.type === "slider") return <HeroSlider block={block} theme={theme} />;

  switch (block.type) {
    case "hero": {
      const buttons = Array.isArray(p.buttons) ? (p.buttons as Array<Record<string, any>>) : [];
      const overlay = Number(p.overlay ?? 0.5);
      const bg = p.bgImage
        ? `linear-gradient(135deg, rgba(9,20,38,${overlay}), rgba(9,20,38,${overlay})), url(${p.bgImage}) center/cover no-repeat`
        : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`;
      return (
        <section style={{ position: "relative", minHeight: p.height || "520px", display: "flex", alignItems: "center", background: bg }}>
          <div style={{ ...WRAP, position: "relative", textAlign: alignToText(p.align), color: p.textColor || "#ffffff", padding: "96px 16px", width: "100%" }}>
            {p.badge ? (
              <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.18)", fontWeight: 700, marginBottom: 16 }}>
                {p.badge}
              </span>
            ) : null}
            <h1 style={{ fontWeight: 900, margin: 0, lineHeight: 1.15 }}>{p.title}</h1>
            {p.subtitle ? (
              <p style={{ opacity: 0.94, marginTop: 16, fontSize: 18, maxWidth: 720, marginInline: p.align === "center" ? "auto" : undefined }}>{p.subtitle}</p>
            ) : null}
            {buttons.length > 0 && (
              <div style={{ display: "flex", gap: 12, justifyContent: alignToFlex(p.align), flexWrap: "wrap", marginTop: 24 }}>
                {buttons.map((b, i) => (
                  <Btn key={i} label={b.label} href={b.href} variant={b.variant} size={b.size} onDark />
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }
    case "cta":
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={WRAP}>
            <div style={{ borderRadius: radius + 8, padding: "46px 34px", textAlign: "center", color: p.textColor || "#ffffff", background: p.bg || `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
              <h2 style={{ fontWeight: 900, margin: 0 }}>{p.title}</h2>
              {p.text ? <p style={{ opacity: 0.92, marginTop: 12 }}>{p.text}</p> : null}
              {p.buttonLabel ? <div style={{ marginTop: 22 }}><Btn label={p.buttonLabel} href={p.buttonHref} onDark /></div> : null}
            </div>
          </div>
        </div>
      );
    case "quote":
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={WRAP}>
            <blockquote style={{ margin: 0, padding: "34px 30px", borderRadius: radius, background: "rgba(11,122,110,0.06)", borderInlineStart: `5px solid ${theme.primary}` }}>
              <i className="fas fa-quote-right fa-2x mb-3" style={{ color: theme.primary, opacity: 0.45 }} />
              <p style={{ fontSize: 20, fontWeight: 600, color: theme.text, margin: 0 }}>{p.quote}</p>
              {p.author ? <footer style={{ marginTop: 12, color: "#64748b" }}>{p.author}</footer> : null}
            </blockquote>
          </div>
        </div>
      );
    case "cards": {
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, any>>) : [];
      const cols = Number(p.columns ?? 3);
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={{ ...WRAP, display: "grid", gap: 22, gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 4 ? 190 : 250}px, 1fr))` }}>
            {items.map((it, i) => (
              <div key={i} style={{ background: "#ffffff", borderRadius: radius, padding: "26px 22px", boxShadow: "0 10px 30px rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.05)" }}>
                <span style={{ display: "inline-flex", width: 52, height: 52, borderRadius: radius, alignItems: "center", justifyContent: "center", background: "rgba(11,122,110,0.1)", color: theme.primary, fontSize: 22 }}>
                  <i className={`fas ${it.icon || "fa-star"}`} />
                </span>
                <h3 style={{ fontWeight: 800, marginTop: 16, marginBottom: 8, color: theme.text }}>{it.title}</h3>
                <p style={{ color: "#64748b", margin: 0 }}>{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "stats": {
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, any>>) : [];
      return (
        <div style={{ padding: "44px 0", background: "rgba(11,122,110,0.05)" }}>
          <div style={{ ...WRAP, display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", textAlign: "center" }}>
            {items.map((it, i) => (
              <div key={i}>
                <i className={`fas ${it.icon || "fa-chart-simple"} fa-2x mb-3`} style={{ color: theme.accent }} />
                <div style={{ fontSize: 38, fontWeight: 900, color: theme.primary, lineHeight: 1 }}>{it.value}</div>
                <div style={{ color: theme.text, marginTop: 6 }}>{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "gallery": {
      const images = (Array.isArray(p.images) ? p.images : []).filter(Boolean);
      const cols = Number(p.columns ?? 3);
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={{ ...WRAP, display: "grid", gap: 14, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {images.length === 0 ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <Img editable={editable} style={{ width: "100%", borderRadius: radius }} />
              </div>
            ) : null}
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={String(src)} alt="" loading="lazy" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: radius, display: "block" }} />
            ))}
          </div>
        </div>
      );
    }
    case "logos": {
      const images = (Array.isArray(p.images) ? p.images : []).filter(Boolean);
      if (!images.length) return null;
      return (
        <div style={{ padding: "34px 0" }}>
          <div style={{ ...WRAP, display: "flex", flexWrap: "wrap", gap: 26, justifyContent: "center", alignItems: "center", opacity: 0.85 }}>
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={String(src)} alt="" loading="lazy" style={{ height: 46, objectFit: "contain" }} />
            ))}
          </div>
        </div>
      );
    }
    case "video": {
      const embed = p.url ? embedUrl(String(p.url)) : null;
      const ratio = String(p.ratio ?? "16/9");
      const padTop = ratio === "1/1" ? "100%" : ratio === "4/3" ? "75%" : "56.25%";
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={WRAP}>
            {embed ? (
              <div style={{ position: "relative", paddingTop: padTop, borderRadius: radius, overflow: "hidden" }}>
                <iframe src={embed} title="video" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
              </div>
            ) : p.url ? (
              <video controls src={String(p.url)} style={{ width: "100%", borderRadius: radius }} />
            ) : (
              <Img editable={editable} style={{ width: "100%", height: 260, borderRadius: radius }} />
            )}
            {p.caption ? <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 10 }}>{p.caption}</div> : null}
          </div>
        </div>
      );
    }
    case "faq": {
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, any>>) : [];
      return (
        <div style={{ padding: "44px 0" }}>
          <div style={{ ...WRAP, maxWidth: 860 }}>
            <div className="d-grid gap-3">
              {items.map((it, i) => (
                <details key={i} style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: radius, padding: "16px 20px" }}>
                  <summary style={{ fontWeight: 700, cursor: "pointer", color: theme.text }}>{it.question}</summary>
                  <p style={{ margin: "12px 0 0", color: "#64748b" }}>{it.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

// ─────────────────────────── العارض الرئيسي ───────────────────────────

/** أنواع البلوكات التي يرسمها RichBlock. */
const RICH_TYPES = ["hero", "slider", "cta", "quote", "cards", "stats", "gallery", "logos", "video", "faq"];

/** حاوية الأعمدة: كل عمود مصفوفة بلوكات متداخلة تُرسم عبر draw. */
function ColumnsBlock({
  block,
  draw,
}: {
  block: Block;
  draw: (b: Block, nested?: boolean) => React.ReactNode;
}) {
  const p = (block.props ?? {}) as Record<string, any>;
  const cols = Array.isArray(p.columns) ? (p.columns as Block[][]) : [];
  return (
    <div style={{ padding: "40px 0" }}>
      <div
        style={{
          ...WRAP,
          display: "grid",
          // auto-fit يجعل الأعمدة تتكدّس تلقائياً على الشاشات الصغيرة
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: Number(p.gap ?? 24),
          alignItems: "start",
        }}
      >
        {cols.map((col, i) => (
          <div key={i} style={{ minWidth: 0 }}>
            {(Array.isArray(col) ? col : []).map((child) => draw(child, true))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlockRenderer({ doc, editable, selectedId, onSelect }: RendererProps) {
  const theme = doc.theme;

  /** يرسم بلوكاً واحداً (يُنادى تعاودياً من حاوية الأعمدة). */
  function draw(block: Block, nested = false): React.ReactNode {
    const inner =
      block.type === "columns" ? (
        <ColumnsBlock block={block} draw={draw} />
      ) : RICH_TYPES.includes(block.type) ? (
        <RichBlock block={block} theme={theme} editable={editable} />
      ) : (
        <SimpleBlock block={block} theme={theme} editable={editable} />
      );

    if (nested) return <div key={block.id}>{inner}</div>;

    const selected = !!editable && selectedId === block.id;
    return (
      <div
        key={block.id}
        data-block-id={block.id}
        onClick={editable && onSelect ? (e) => { e.stopPropagation(); onSelect(block.id); } : undefined}
        style={
          editable
            ? {
                position: "relative",
                outline: selected ? `2px solid ${theme.primary}` : "1px dashed rgba(11,122,110,0.22)",
                outlineOffset: -1,
                cursor: "pointer",
              }
            : undefined
        }
      >
        {selected && (
          <span
            style={{
              position: "absolute",
              top: 0,
              insetInlineStart: 0,
              zIndex: 5,
              background: theme.primary,
              color: "#fff",
              fontSize: 11,
              padding: "2px 8px",
              borderEndEndRadius: 8,
              pointerEvents: "none",
            }}
          >
            {block.type}
          </span>
        )}
        {inner}
      </div>
    );
  }

  if (!doc.blocks.length) {
    return (
      <div style={{ padding: "80px 16px", textAlign: "center", color: "#94a3b8" }}>
        <i className="fas fa-layer-group fa-2x mb-3" />
        <p className="mb-0">{editable ? "Add your first block" : ""}</p>
      </div>
    );
  }

  return <>{doc.blocks.map((b) => draw(b))}</>;
}

export default BlockRenderer;
