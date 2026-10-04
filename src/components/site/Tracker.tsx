"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { EVENT_TYPES, type EventType, flush, track } from "@/lib/track";

const MAX_MS = 1_800_000;
let lastView = { path: "", at: 0 };

/**
 * Emits page_view / page_dwell (visible time only), Home section_dwell, loader_timing, project_view and
 * not_found, and captures clicks on elements with data-track attributes (plan §12.3, §17.1).
 */
export function Tracker() {
  const pathname = usePathname();

  // Clicks: <a data-track="project_link_click" data-track-id="1" data-track-target="live">
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el || !EVENT_TYPES.includes(el.dataset.track as EventType)) return;
      const id = Number(el.dataset.trackId);
      track({ t: el.dataset.track as EventType, id: Number.isFinite(id) && id > 0 ? id : undefined, tg: el.dataset.trackTarget || undefined, p: location.pathname });
    };
    const onSplash = () => track({ t: "loader_timing", ms: Math.min(MAX_MS, Math.round(performance.now())) });
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("ms:splash-done", onSplash);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("ms:splash-done", onSplash);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // Page view + visible dwell + Home sections, per route.
  useEffect(() => {
    // one view per route change (React dev mode mounts effects twice)
    const now = performance.now();
    if (lastView.path !== pathname || now - lastView.at > 1500) {
      lastView = { path: pathname, at: now };
      track({ t: "page_view", p: pathname });
      const view = document.querySelector<HTMLElement>("[data-track-view]")?.dataset.trackView ?? "";
      if (view.startsWith("project:")) track({ t: "project_view", id: Number(view.slice(8)), p: pathname });
      if (view === "not_found") track({ t: "not_found", p: pathname });
    }

    let visible = 0;
    let since = document.visibilityState === "visible" ? performance.now() : 0;
    const sections = new Map<string, { ms: number; since: number; inView: boolean }>();
    const counting = () => document.visibilityState === "visible" && document.documentElement.dataset.splash !== "show";
    const startVisible = () => {
      if (!counting()) return;
      const now = performance.now();
      for (const v of sections.values()) if (v.inView && !v.since) v.since = now;
    };
    const closeSections = () => {
      const now = performance.now();
      for (const [s, v] of sections) {
        if (v.since) {
          v.ms += now - v.since;
          v.since = 0;
        }
        if (v.ms >= 500) track({ t: "section_dwell", s, ms: Math.min(MAX_MS, Math.round(v.ms)), p: pathname });
        v.ms = 0;
      }
    };
    const emitDwell = () => {
      if (since) {
        visible += performance.now() - since;
        since = 0;
      }
      if (visible >= 300) track({ t: "page_dwell", p: pathname, ms: Math.min(MAX_MS, Math.round(visible)) });
      visible = 0;
    };
    const io = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const e of entries) {
          const s = (e.target as HTMLElement).dataset.trackSection!;
          const v = sections.get(s) ?? { ms: 0, since: 0, inView: false };
          v.inView = e.isIntersecting;
          if (v.inView && counting()) v.since ||= now;
          else if (!v.inView && v.since) {
            v.ms += now - v.since;
            v.since = 0;
          }
          sections.set(s, v);
        }
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll<HTMLElement>("[data-track-section]").forEach((el) => io.observe(el));
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        emitDwell();
        closeSections();
        flush();
      } else {
        since = performance.now();
        startVisible();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("ms:splash-done", startVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("ms:splash-done", startVisible);
      io.disconnect();
      emitDwell();
      closeSections();
      flush();
    };
  }, [pathname]);

  return null;
}
