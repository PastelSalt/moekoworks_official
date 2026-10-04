// Cookieless visit tracker (port of kotoha's track.js, plan §17.1). The visit id lives in memory only:
// nothing is stored in the browser. Events are batched and sent with sendBeacon.
export const EVENT_TYPES = [
  "page_view",
  "page_dwell",
  "section_dwell",
  "loader_timing",
  "project_view",
  "project_open",
  "project_link_click",
  "video_play",
  "video_complete",
  "image_open",
  "certificate_open",
  "outbound_click",
  "contact_start",
  "contact_submit",
  "copy_email",
  "motion_toggle",
  "filter_use",
  "not_found",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type TrackEvent = { t: EventType; p?: string; s?: string; ms?: number; id?: number; tg?: string };

type Context = { d: "mobile" | "tablet" | "desktop" | "unknown"; l?: string; r?: string; u?: { s: string; m?: string; c?: string }; nt?: 0 | 1 };

const state: { visitId: string; queue: TrackEvent[]; ctx: Context | null } = { visitId: "", queue: [], ctx: null };

function context(): Context {
  if (state.ctx) return state.ctx;
  let d: Context["d"] = "unknown";
  try {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    d = coarse ? (Math.min(screen.width, screen.height) >= 600 ? "tablet" : "mobile") : "desktop";
  } catch {
    /* keep unknown */
  }
  let r: string | undefined;
  try {
    const host = document.referrer ? new URL(document.referrer).host : "";
    if (host && host !== location.host) r = host.slice(0, 253);
  } catch {
    r = undefined;
  }
  const q = new URLSearchParams(location.search);
  const source = q.get("utm_source") ?? q.get("ref");
  const u = source ? { s: source.slice(0, 60), m: q.get("utm_medium")?.slice(0, 60) || undefined, c: q.get("utm_campaign")?.slice(0, 80) || undefined } : undefined;
  let nt: 0 | 1 = 0;
  try {
    nt = localStorage.getItem("ms_nt") === "1" ? 1 : 0; // "Don't count my visits" (admin Account page)
  } catch {
    nt = 0;
  }
  state.ctx = { d, l: navigator.language?.slice(0, 10), r, u, nt };
  return state.ctx;
}

export function track(e: TrackEvent) {
  if (typeof window === "undefined") return;
  if (!state.visitId) state.visitId = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  context();
  state.queue.push(e);
  if (state.queue.length >= 25) flush();
  // don't rely on unload alone (beacons sent while a page is torn down are sometimes lost)
  else if (!timer) timer = window.setTimeout(flush, 4000);
}

let timer = 0;

export function flush() {
  if (typeof window === "undefined") return;
  window.clearTimeout(timer);
  timer = 0;
  if (!state.queue.length) return;
  const ctx = context();
  const events = state.queue.splice(0, 50);
  if (ctx.nt) return; // opted out: nothing leaves the browser
  const body = JSON.stringify({ v: state.visitId, ...ctx, e: events });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch {
    /* fall through to fetch */
  }
  fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => undefined);
}
