/**
 * مكتبة بلوكات محرّر الصفحات (Page Builder) — أنواع البلوكات، قيمها الافتراضية،
 * والقوالب الجاهزة (Sections) على طريقة Elementor.
 * البلوكات تُخزَّن كـ JSON واحد في عمود pages.blocks على الشكل:
 *   { version: 1, theme: {...}, blocks: [ { id, type, props } ] }
 */

export type Align = "start" | "center" | "end";

export type BlockType =
  | "hero"
  | "slider"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "video"
  | "divider"
  | "spacer"
  | "html"
  | "cards"
  | "list"
  | "quote"
  | "stats"
  | "gallery"
  | "cta"
  | "faq"
  | "logos"
  | "columns";

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

export interface PageTheme {
  primary: string;
  accent: string;
  text: string;
  bg: string;
  radius: number;
}

export interface PageDoc {
  version: number;
  theme: PageTheme;
  blocks: Block[];
}

export const DEFAULT_THEME: PageTheme = {
  primary: "#0b7a6e",
  accent: "#e9a319",
  text: "#1f2937",
  bg: "#ffffff",
  radius: 16,
};

/** معرّف قصير فريد للبلوك. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
}

/** يقرأ مستند الصفحة من JSON المحفوظ مع القيم الافتراضية الآمنة. */
export function parsePageDoc(json?: string | null): PageDoc {
  const empty: PageDoc = { version: 1, theme: { ...DEFAULT_THEME }, blocks: [] };
  if (!json) return empty;
  try {
    const raw = JSON.parse(json) as Partial<PageDoc>;
    const theme = { ...DEFAULT_THEME, ...(raw.theme ?? {}) } as PageTheme;
    const list = Array.isArray(raw.blocks) ? raw.blocks : [];
    const blocks: Block[] = list
      .filter((b) => b && typeof b === "object" && typeof (b as Block).type === "string")
      .map((b) => {
        const block = b as Block;
        return {
          id: block.id || uid(),
          type: block.type,
          props: (block.props ?? {}) as Record<string, unknown>,
        };
      });
    return { version: raw.version ?? 1, theme, blocks };
  } catch {
    return empty;
  }
}

/** يحوّل المستند إلى نص مخزَّن في عمود pages.blocks. */
export function serializePageDoc(doc: PageDoc): string {
  return JSON.stringify({ version: 1, theme: doc.theme, blocks: doc.blocks });
}

const clean = (v: unknown) =>
  typeof v === "string" ? v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

/** يستخرج نصاً مبسّطاً من البلوكات (يُرسَل في حقل content الإلزامي للـAPI). */
export function docToText(doc: PageDoc): string {
  const out: string[] = [];
  const walk = (list: Block[]) => {
    for (const b of list) {
      const p = (b.props ?? {}) as Record<string, unknown>;
      for (const k of ["title", "subtitle", "text", "html", "quote", "badge", "caption", "label"]) {
        const v = clean(p[k]);
        if (v) out.push(v);
      }
      for (const k of ["items", "slides", "images"]) {
        const arr = p[k];
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
          if (typeof item === "string") { const v = clean(item); if (v) out.push(v); continue; }
          const o = (item ?? {}) as Record<string, unknown>;

// ─────────────────────────── مكتبة العناصر (Widgets) ───────────────────────────

export interface WidgetDef {
  type: BlockType;
  label: string;
  icon: string;
  group: "basic" | "media" | "layout" | "pro";
  defaults: () => Record<string, unknown>;
}

export const WIDGETS: WidgetDef[] = [
  // ── أساسي ──
  { type: "heading", label: "Heading", icon: "fa-heading", group: "basic", defaults: () => ({ text: "Heading text", level: 2, align: "start", color: "" }) },
  { type: "text", label: "Text", icon: "fa-align-left", group: "basic", defaults: () => ({ html: "<p>Write your text here…</p>", align: "start", color: "" }) },
  { type: "button", label: "Button", icon: "fa-hand-pointer", group: "basic", defaults: () => ({ label: "Click here", href: "#", variant: "primary", align: "start", size: "md" }) },
  { type: "list", label: "Icon list", icon: "fa-list-check", group: "basic", defaults: () => ({ items: [{ icon: "fa-check", text: "First item" }, { icon: "fa-check", text: "Second item" }] }) },
  { type: "divider", label: "Divider", icon: "fa-minus", group: "basic", defaults: () => ({ style: "solid", color: "", width: 100 }) },
  { type: "spacer", label: "Spacer", icon: "fa-arrows-up-down", group: "basic", defaults: () => ({ height: 48 }) },

  // ── وسائط ──
  { type: "image", label: "Image", icon: "fa-image", group: "media", defaults: () => ({ src: "", alt: "", radius: 16, width: 100, align: "center", caption: "" }) },
  { type: "gallery", label: "Gallery", icon: "fa-images", group: "media", defaults: () => ({ columns: 3, images: ["", "", ""] }) },
  { type: "video", label: "Video", icon: "fa-video", group: "media", defaults: () => ({ url: "", ratio: "16/9", caption: "" }) },
  { type: "logos", label: "Logos", icon: "fa-award", group: "media", defaults: () => ({ images: ["", "", "", ""] }) },

  // ── تخطيط ──
  { type: "columns", label: "Columns", icon: "fa-table-columns", group: "layout", defaults: () => ({ columns: [[], []], gap: 24 }) },
  { type: "cards", label: "Cards", icon: "fa-table-cells-large", group: "layout", defaults: () => ({ columns: 3, items: [{ icon: "fa-book-quran", title: "Card one", text: "Short description." }, { icon: "fa-graduation-cap", title: "Card two", text: "Short description." }, { icon: "fa-users", title: "Card three", text: "Short description." }] }) },

  // ── احترافي (Pro) ──
  { type: "hero", label: "Hero", icon: "fa-panorama", group: "pro", defaults: () => ({ badge: "", title: "Your headline goes here", subtitle: "A short supporting sentence.", bgImage: "", overlay: 0.55, align: "center", textColor: "#ffffff", height: "540px", buttons: [{ label: "Get started", href: "#", variant: "primary" }] }) },
  { type: "slider", label: "Hero slider", icon: "fa-sliders", group: "pro", defaults: () => ({ height: "540px", autoplay: true, overlay: 0.5, slides: [{ image: "", title: "First slide", subtitle: "Slide description", buttonLabel: "Learn more", buttonHref: "#" }, { image: "", title: "Second slide", subtitle: "Slide description", buttonLabel: "", buttonHref: "" }] }) },
  { type: "stats", label: "Counters", icon: "fa-chart-simple", group: "pro", defaults: () => ({ items: [{ value: "1200", label: "Students", icon: "fa-user-graduate" }, { value: "300", label: "Certificates", icon: "fa-certificate" }, { value: "11", label: "Languages", icon: "fa-language" }] }) },
  { type: "quote", label: "Testimonial", icon: "fa-quote-right", group: "pro", defaults: () => ({ quote: "A wonderful platform that made memorising and reciting Al-Fatiha easy.", author: "— A student" }) },
  { type: "cta", label: "Call to action", icon: "fa-bullhorn", group: "pro", defaults: () => ({ title: "Ready to start your Ijazah journey?", text: "Join Fatiha.id today.", buttonLabel: "Join now", buttonHref: "#", bg: "", textColor: "#ffffff" }) },
  { type: "faq", label: "FAQ", icon: "fa-circle-question", group: "pro", defaults: () => ({ items: [{ question: "What is an Ijazah?", answer: "It is a certified permission to recite the Quran." }, { question: "How long does it take?", answer: "It depends on your pace and practice." }] }) },
  { type: "html", label: "Custom HTML", icon: "fa-code", group: "pro", defaults: () => ({ code: "<div style=\"text-align:center\">Custom HTML</div>" }) },
];

/** ينشئ بلوكاً جديداً بقيم افتراضية بحسب النوع. */
export function createBlock(type: BlockType): Block {
  const def = WIDGETS.find((w) => w.type === type);
  return { id: uid(), type, props: def ? def.defaults() : {} };
}

/** ينشئ بلوكاً من كائن قادم من الـAI (يضيف معرّفاً ويضمن النوع). */
export function blockFromAI(raw: unknown): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { type?: unknown; props?: unknown };
  if (typeof o.type !== "string") return null;
  const type = o.type as BlockType;
  if (!WIDGETS.some((w) => w.type === type)) return null;
  return { id: uid(), type, props: (o.props ?? {}) as Record<string, unknown> };

// ─────────────────────────── قوالب الأقسام الجاهزة (Sections) ───────────────────────────

export interface SectionTemplate {
  id: string;
  label: string;
  icon: string;
  build: () => Block[];
}

const b = (type: BlockType, props: Record<string, unknown>): Block => ({ id: uid(), type, props });

export const TEMPLATES: SectionTemplate[] = [
  {
    id: "hero",
    label: "Hero section",
    icon: "fa-panorama",
    build: () => [b("hero", WIDGETS.find((w) => w.type === "hero")!.defaults())],
  },
  {
    id: "hero-slider",
    label: "Hero slider",
    icon: "fa-sliders",
    build: () => [b("slider", WIDGETS.find((w) => w.type === "slider")!.defaults())],
  },
  {
    id: "features",
    label: "Features grid",
    icon: "fa-table-cells-large",
    build: () => [
      b("heading", { text: "Why Fatiha?", level: 2, align: "center", color: "" }),
      b("text", { html: "<p style=\"text-align:center\">Everything you need to learn, recite and get certified.</p>", align: "center", color: "" }),
      b("cards", { columns: 3, items: [
        { icon: "fa-book-quran", title: "Learn", text: "Step-by-step lessons on Surah Al-Fatiha." },
        { icon: "fa-microphone-lines", title: "Recite", text: "Record your recitation and get feedback." },
        { icon: "fa-certificate", title: "Get certified", text: "Earn a verified Ijazah certificate." },
      ] }),
    ],
  },
  {
    id: "about",
    label: "Text + image",
    icon: "fa-table-columns",
    build: () => [
      b("columns", {
        gap: 28,
        columns: [
          [b("heading", { text: "About the platform", level: 3, align: "start", color: "" }),
           b("text", { html: "<p>Fatiha.id helps people worldwide recite Surah Al-Fatiha correctly, understand its meaning and receive certification.</p>", align: "start", color: "" }),
           b("button", { label: "Learn more", href: "#", variant: "primary", align: "start", size: "md" })],
          [b("image", { src: "", alt: "About", radius: 18, width: 100, align: "center", caption: "" })],
        ],
      }),
    ],
  },
  {
    id: "stats",
    label: "Counters",
    icon: "fa-chart-simple",
    build: () => [b("stats", WIDGETS.find((w) => w.type === "stats")!.defaults())],
  },
  {
    id: "testimonial",
    label: "Testimonial",
    icon: "fa-quote-right",
    build: () => [b("quote", WIDGETS.find((w) => w.type === "quote")!.defaults())],
  },
  {
    id: "gallery",
    label: "Gallery",

// ─────────────────────────── مخطط الحقول للوحة الخصائص ───────────────────────────

export type FieldType = "text" | "textarea" | "html" | "number" | "color" | "select" | "toggle" | "range";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

const ALIGN_OPTS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
];
const VARIANT_OPTS = [
  { value: "primary", label: "Primary" },
  { value: "outline", label: "Outline" },
];
const SIZE_OPTS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

/** حقول لوحة الخصائص لكل نوع بلوك (تُقرأ من الواجهة لبناء النموذج). */
export const FIELDS: Record<BlockType, FieldDef[]> = {
  heading: [
    { key: "text", label: "Text", type: "text" },
    { key: "level", label: "Level", type: "select", options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: `H${n}` })) },
    { key: "align", label: "Align", type: "select", options: ALIGN_OPTS },
    { key: "color", label: "Color", type: "color" },
  ],
  text: [
    { key: "html", label: "Content", type: "html" },
    { key: "align", label: "Align", type: "select", options: ALIGN_OPTS },
    { key: "color", label: "Color", type: "color" },
  ],
  button: [
    { key: "label", label: "Label", type: "text" },
    { key: "href", label: "Link", type: "text" },
    { key: "variant", label: "Style", type: "select", options: VARIANT_OPTS },
    { key: "size", label: "Size", type: "select", options: SIZE_OPTS },
    { key: "align", label: "Align", type: "select", options: ALIGN_OPTS },
  ],
  divider: [
    { key: "style", label: "Style", type: "select", options: ["solid", "dashed", "dotted"].map((v) => ({ value: v, label: v })) },
    { key: "color", label: "Color", type: "color" },
    { key: "width", label: "Width", type: "range", min: 10, max: 100, step: 5 },
  ],
  spacer: [{ key: "height", label: "Height", type: "range", min: 8, max: 240, step: 4 }],
  image: [
    { key: "src", label: "Image URL", type: "text" },
    { key: "alt", label: "Alt text", type: "text" },
    { key: "caption", label: "Caption", type: "text" },
    { key: "width", label: "Width", type: "range", min: 10, max: 100, step: 5 },
    { key: "radius", label: "Radius", type: "range", min: 0, max: 60, step: 2 },
    { key: "align", label: "Align", type: "select", options: ALIGN_OPTS },
  ],
  video: [
    { key: "url", label: "Video URL", type: "text" },
    { key: "ratio", label: "Ratio", type: "select", options: ["16/9", "4/3", "1/1"].map((v) => ({ value: v, label: v })) },
    { key: "caption", label: "Caption", type: "text" },
  ],
  html: [{ key: "code", label: "Custom HTML", type: "html" }],
  columns: [
    { key: "gap", label: "Gap", type: "range", min: 0, max: 80, step: 4 },
    { key: "columns", label: "Columns", type: "text" },
  ],
  hero: [
    { key: "badge", label: "Badge", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "bgImage", label: "Background image", type: "text" },
    { key: "overlay", label: "Overlay", type: "range", min: 0, max: 0.95, step: 0.05 },
    { key: "height", label: "Height", type: "text", placeholder: "540px" },
    { key: "align", label: "Align", type: "select", options: ALIGN_OPTS },
    { key: "textColor", label: "Text color", type: "color" },
    { key: "buttons", label: "Buttons", type: "text" },
  ],
  slider: [
    { key: "height", label: "Height", type: "text", placeholder: "540px" },
    { key: "overlay", label: "Overlay", type: "range", min: 0, max: 0.95, step: 0.05 },
    { key: "autoplay", label: "Autoplay", type: "toggle" },
    { key: "slides", label: "Slides", type: "text" },
  ],
  quote: [
    { key: "quote", label: "Quote", type: "textarea" },
    { key: "author", label: "Author", type: "text" },
  ],
  cta: [
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Text", type: "textarea" },
    { key: "buttonLabel", label: "Button label", type: "text" },
    { key: "buttonHref", label: "Button link", type: "text" },
    { key: "bg", label: "Background", type: "color" },
    { key: "textColor", label: "Text color", type: "color" },
  ],
  cards: [
    { key: "columns", label: "Columns", type: "select", options: [2, 3, 4].map((n) => ({ value: String(n), label: String(n) })) },
    { key: "items", label: "Items", type: "text" },
  ],
  list: [{ key: "items", label: "Items", type: "text" }],
  stats: [{ key: "items", label: "Items", type: "text" }],
  faq: [{ key: "items", label: "Items", type: "text" }],
  gallery: [
    { key: "columns", label: "Columns", type: "select", options: [2, 3, 4].map((n) => ({ value: String(n), label: String(n) })) },
    { key: "images", label: "Images", type: "text" },
  ],
  logos: [{ key: "images", label: "Images", type: "text" }],
};

// ─────────────────────────── العناصر المتكرّرة (Repeaters) ───────────────────────────

export interface RepeaterDef {
  key: string;
  label: string;
  /** objects = عناصر كائنات، strings = قائمة نصوص/روابط، blocks = أعمدة تحتوي بلوكات */
  kind: "objects" | "strings" | "blocks";
  fields?: FieldDef[];
  blank?: () => Record<string, unknown>;
}

export const REPEATERS: Partial<Record<BlockType, RepeaterDef[]>> = {
  hero: [
    {
      key: "buttons", label: "Buttons", kind: "objects",
      blank: () => ({ label: "New button", href: "#", variant: "primary" }),
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "Link", type: "text" },
        { key: "variant", label: "Style", type: "select", options: VARIANT_OPTS },
      ],
    },
  ],
  slider: [
    {
      key: "slides", label: "Slides", kind: "objects",
      blank: () => ({ image: "", title: "New slide", subtitle: "", buttonLabel: "", buttonHref: "" }),
      fields: [
        { key: "image", label: "Image URL", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "subtitle", label: "Subtitle", type: "text" },
        { key: "buttonLabel", label: "Button label", type: "text" },
        { key: "buttonHref", label: "Button link", type: "text" },
      ],
    },
  ],
  cards: [
    {
      key: "items", label: "Cards", kind: "objects",
      blank: () => ({ icon: "fa-star", title: "New card", text: "" }),
      fields: [
        { key: "icon", label: "Icon", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "text", label: "Text", type: "textarea" },
      ],
    },
  ],
  list: [
    {
      key: "items", label: "Items", kind: "objects",
      blank: () => ({ icon: "fa-check", text: "New item" }),
      fields: [
        { key: "icon", label: "Icon", type: "text" },
        { key: "text", label: "Text", type: "text" },
      ],
    },
  ],
  stats: [
    {
      key: "items", label: "Counters", kind: "objects",
      blank: () => ({ value: "100", label: "New counter", icon: "fa-chart-simple" }),
      fields: [
        { key: "value", label: "Value", type: "text" },
        { key: "label", label: "Label", type: "text" },
        { key: "icon", label: "Icon", type: "text" },
      ],
    },
  ],
  faq: [
    {
      key: "items", label: "Questions", kind: "objects",
      blank: () => ({ question: "New question", answer: "" }),
      fields: [
        { key: "question", label: "Question", type: "text" },
        { key: "answer", label: "Answer", type: "textarea" },
      ],
    },
  ],
  gallery: [{ key: "images", label: "Images", kind: "strings" }],
  logos: [{ key: "images", label: "Images", kind: "strings" }],
  columns: [{ key: "columns", label: "Columns", kind: "blocks" }],
};

    icon: "fa-images",
    build: () => [
      b("heading", { text: "Gallery", level: 2, align: "center", color: "" }),
      b("gallery", WIDGETS.find((w) => w.type === "gallery")!.defaults()),
    ],
  },
  {
    id: "faq",
    label: "FAQ",
    icon: "fa-circle-question",
    build: () => [
      b("heading", { text: "Frequently asked questions", level: 2, align: "center", color: "" }),
      b("faq", WIDGETS.find((w) => w.type === "faq")!.defaults()),
    ],
  },
  {
    id: "cta",
    label: "Call to action",
    icon: "fa-bullhorn",
    build: () => [b("cta", WIDGETS.find((w) => w.type === "cta")!.defaults())],
  },
  {
    id: "html",
    label: "Custom HTML / Embed",
    icon: "fa-code",
    build: () => [b("html", { code: "<div style=\"text-align:center\">Custom HTML block</div>" })],
  },
];

}

          for (const kk of ["title", "text", "label", "question", "answer", "subtitle", "value"]) {
            const v = clean(o[kk]);
            if (v) out.push(v);
          }
        }
      }
      if (b.type === "columns" && Array.isArray(p.columns)) {
        for (const col of p.columns) if (Array.isArray(col)) walk(col as Block[]);
      }
    }
  };
  walk(doc.blocks);
  return out.join("\n").slice(0, 20000);
}
