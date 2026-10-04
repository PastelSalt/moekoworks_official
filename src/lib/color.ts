// Accent maths for the per-project theme (plan §9.4). Pure functions: used on save (admin) and as a render fallback.
const INK = "#2E2A36";

type RGB = [number, number, number];

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: RGB) {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
const toLinear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function toOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}
function fromOklch([L, C, H]: [number, number, number]) {
  const A = C * Math.cos(H);
  const B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return rgbToHex([
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]);
}

/** Darkens the accent in OKLCH until white text on it (and it on white) reaches 4.5:1. */
export function strongOf(accent: string) {
  const [L0, C0, H] = toOklch(accent);
  let L = Math.min(L0, 0.62);
  let hex = fromOklch([L, Math.min(C0 * 1.15, 0.2), H]);
  while (contrast(hex, "#FFFFFF") < 4.6 && L > 0.2) {
    L -= 0.01;
    hex = fromOklch([L, Math.min(C0 * 1.15, 0.2), H]);
  }
  return hex;
}

/** Ink on the accent when it reads well, otherwise white. */
export function onAccentOf(accent: string) {
  return contrast(INK, accent) >= 4.5 ? INK : "#FFFFFF";
}

/** Clamps over-saturated accents so the generated tints stay pastel. */
export function pastelize(accent: string) {
  const [L, C, H] = toOklch(accent);
  return C > 0.16 ? fromOklch([Math.max(L, 0.72), 0.16, H]) : accent.toUpperCase();
}

/** CSS custom properties for a project page / card. Falls back to Moesoft pink. */
export function accentVars(p: { accentColor: string | null; accentColor2?: string | null; accentStrong?: string | null; accentOn?: string | null }) {
  if (!isHex(p.accentColor)) return {};
  const accent = pastelize(p.accentColor);
  const second = isHex(p.accentColor2) ? p.accentColor2 : null;
  return {
    "--project-accent": accent,
    "--project-accent-2": second ?? "var(--blue-300)",
    "--project-accent-2-strong": second ? strongOf(second) : "var(--blue-700)",
    "--project-accent-strong": isHex(p.accentStrong) ? p.accentStrong : strongOf(p.accentColor),
    "--project-on-accent": isHex(p.accentOn) ? p.accentOn : onAccentOf(accent),
  } as Record<string, string>;
}
