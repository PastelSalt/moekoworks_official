// Client-side motion preferences and shared scroll state (port of kotoha's prefs.js + scroll-life.js).
// "calm" when the device asks for reduced motion or the visitor turned motion off (remembered in this browser).
import type Lenis from "lenis";

export type MotionMode = "full" | "calm";
const KEY = "ms_motion";
const listeners = new Set<(mode: MotionMode) => void>();

const reduceQuery = () => window.matchMedia("(prefers-reduced-motion: reduce)");
export const deviceReduces = () => typeof window !== "undefined" && reduceQuery().matches;

function readOff() {
  try {
    return localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

export function motionMode(): MotionMode {
  if (typeof document === "undefined") return "full";
  return document.documentElement.dataset.motion === "calm" ? "calm" : "full";
}
export const isCalm = () => motionMode() === "calm";

function apply() {
  const mode: MotionMode = deviceReduces() || readOff() ? "calm" : "full";
  document.documentElement.dataset.motion = mode;
  listeners.forEach((cb) => cb(mode));
}

export function setMotionOff(off: boolean) {
  try {
    if (off) localStorage.setItem(KEY, "off");
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  apply();
}

/** Subscribe to mode changes (returns an unsubscribe function). */
export function onMotionChange(cb: (mode: MotionMode) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

let wired = false;
export function wireMotionPrefs() {
  if (wired) return;
  wired = true;
  reduceQuery().addEventListener("change", apply);
}

/** Save-Data or a slow connection: no autoplaying video, no falling petals (plan §7.6). */
export function saveData() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)));
}

// ── Smooth scroll (Lenis, desktop only) ───────────────────────────────
let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};
export const getLenis = () => lenis;

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: isCalm() ? "auto" : "smooth" });
}

// ── Scroll velocity (px/ms, + = down), smoothed; drives --lean and the marquees ─────
let velocity = 0;
export const scrollVelocity = () => velocity;
export const setScrollVelocity = (v: number) => {
  velocity = v;
};
