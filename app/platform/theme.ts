export type ThemeName = "light" | "dark";

type ThemeVars = {
  "--bg": string;
  "--bg2": string;
  "--bg3": string;
  "--txt": string;
  "--txt2": string;
  "--txt3": string;
  "--border": string;
  "--border2": string;
  "--red-bg": string;
  "--green-bg": string;
  "--blue-bg": string;
  "--red"?: string;
};

// منقولة حرفياً من public/munjez-platform.html (THEMES)
export const THEMES: Record<ThemeName, ThemeVars> = {
  light: {
    "--bg": "#f5f4f0",
    "--bg2": "#edece8",
    "--bg3": "#e3e2de",
    "--txt": "#1a1a18",
    "--txt2": "#6b6b65",
    "--txt3": "#a0a09a",
    "--border": "#dcdbd5",
    "--border2": "#c8c7c0",
    "--red-bg": "#fff0f0",
    "--green-bg": "#f0faf4",
    "--blue-bg": "#eff6ff",
  },
  dark: {
    "--bg": "#30343a",
    "--bg2": "#3a3f46",
    "--bg3": "#484e57",
    "--txt": "#f7f8fa",
    "--txt2": "#d0d3d8",
    "--txt3": "#9da3ab",
    "--border": "#505760",
    "--border2": "#69727e",
    "--red": "#ff9090",
    "--red-bg": "#4b373b",
    "--green-bg": "#35483e",
    "--blue-bg": "#38475b",
  },
};

export type AccentPreset = {
  n: string;
  a: string;
  m: string;
  bg: string;
  t?: string;
  sw?: string;
};

// منقولة حرفياً من public/munjez-platform.html (PRESETS) — الأول "أبيض وأسود"
// هو نفس اللون الأسود الذي كان مثبَّتاً سابقاً، ويبقى الافتراضي هنا أيضاً.
export const PRESETS: AccentPreset[] = [
  { n: "أبيض وأسود", a: "#000000", m: "#2b2b2b", bg: "#f0f0f0", t: "#ffffff", sw: "linear-gradient(135deg,#000 0 50%,#fff 50% 100%)" },
  { n: "زيتوني", a: "#2d5016", m: "#4a8022", bg: "#e8f0df" },
  { n: "بنفسجي", a: "#5b21b6", m: "#7c3aed", bg: "#ede9fe" },
  { n: "أزرق", a: "#1e40af", m: "#2563eb", bg: "#dbeafe" },
  { n: "وردي", a: "#9d174d", m: "#db2777", bg: "#fce7f3" },
  { n: "أحمر", a: "#991b1b", m: "#dc2626", bg: "#fee2e2" },
  { n: "برتقالي", a: "#92400e", m: "#d97706", bg: "#fef3c7" },
  { n: "فيروزي", a: "#065f46", m: "#059669", bg: "#d1fae5" },
  { n: "رمادي", a: "#374151", m: "#6b7280", bg: "#f3f4f6" },
  { n: "سماوي", a: "#0e7490", m: "#0891b2", bg: "#cffafe" },
  { n: "زهري", a: "#831843", m: "#ec4899", bg: "#fdf2f8" },
];

export function lighten(hex: string, f = 0.88): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * f)}, ${Math.round(g + (255 - g) * f)}, ${Math.round(b + (255 - b) * f)})`;
}

export function rgbaHex(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export type AccentVars = {
  "--accent": string;
  "--accent-mid": string;
  "--accent-bg": string;
  "--table-tint": string;
};

// منقولة من applyPreset() في المرجع — نفس منطق "الهوية السوداء تبقى محايدة
// في الوضع الغامق" (identityDark) حتى لا يختفي الأسود في خلفية غامقة.
export function computeAccentVars(preset: AccentPreset, theme: ThemeName): AccentVars {
  const identityDark = theme === "dark" && preset.a.toLowerCase() === "#000000";
  const uiAccent = identityDark ? "#747d88" : preset.a;
  return {
    "--accent": uiAccent,
    "--accent-mid": identityDark ? "#aab1ba" : preset.m,
    "--accent-bg": theme === "dark" ? rgbaHex(preset.t || preset.a, 0.16) : preset.bg,
    "--table-tint": preset.t || preset.a,
  };
}

export function findPresetByAccent(accent: string): AccentPreset | undefined {
  return PRESETS.find((p) => p.a.toLowerCase() === accent.toLowerCase());
}

export function customPreset(hex: string): AccentPreset {
  return {
    n: "مخصص",
    a: hex,
    m: hex,
    bg: lighten(hex),
    t: hex.toLowerCase() === "#000000" ? "#ffffff" : hex,
  };
}
