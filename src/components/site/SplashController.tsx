"use client";

import { useEffect } from "react";
import { getLenis, isCalm } from "@/lib/motion";

const MIN_MS = 1600; // the logo needs ~1.6 s to assemble
const SOFT_MS = 3000; // stop waiting for slow media after this (the prepaint script hard-caps at 6.5 s)

/**
 * Real progress (fonts, first-screen images, window load, minimum time) → "LOADING ✿ n %".
 * Exit: the logo flies into the sidebar / top-bar logo spot (FLIP) while the stage fades in; calm mode just fades.
 */
export function SplashController() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.splash !== "show") return;
    const root = document.querySelector<HTMLElement>("[data-splash-root]");
    if (!root) return;
    const pctEl = root.querySelector<HTMLElement>("[data-splash-pct]");
    const barEl = root.querySelector<HTMLElement>("[data-splash-bar]");
    const logo = root.querySelector<HTMLElement>("[data-splash-logo]");
    getLenis()?.stop();

    let fontsDone = false;
    document.fonts?.ready.then(() => (fontsDone = true)).catch(() => (fontsDone = true));
    const media = Array.from(document.querySelectorAll<HTMLImageElement>("main img")).filter(
      (img) => img.loading !== "lazy" && img.getBoundingClientRect().top < window.innerHeight,
    );

    let shown = 0;
    let raf = 0;
    let leaving = false;

    const progress = () => {
      const t = performance.now();
      const time = Math.min(1, t / MIN_MS);
      const imgs = media.length ? media.filter((i) => i.complete).length / media.length : 1;
      const loaded = document.readyState === "complete" ? 1 : 0;
      return { t, value: 0.25 * time + 0.25 * (fontsDone ? 1 : 0) + 0.25 * imgs + 0.25 * loaded, ready: t >= MIN_MS && fontsDone && (loaded === 1 || t >= SOFT_MS) };
    };

    const paint = (v: number) => {
      if (pctEl) pctEl.textContent = String(Math.round(v * 100));
      if (barEl) barEl.style.transform = `scaleX(${v.toFixed(3)})`;
    };

    const finish = () => {
      html.dataset.splash = "done";
      try {
        sessionStorage.setItem("ms_splash", "1");
      } catch {
        /* private mode: the splash may show again next time */
      }
      getLenis()?.start();
      window.dispatchEvent(new Event("ms:splash-done"));
    };

    const leave = () => {
      leaving = true;
      paint(1);
      const target = Array.from(document.querySelectorAll<HTMLElement>("[data-splash-target], [data-splash-target-mobile]"))
        .map((el) => el.querySelector("img") ?? el)
        .find((el) => el.getBoundingClientRect().width > 0);
      const bg = root.querySelector<HTMLElement>(".splash__bg");
      const meta = root.querySelectorAll<HTMLElement>(".splash__meta, .splash__bar");
      if (isCalm() || !logo || !target || !logo.animate) {
        root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: "ease-out", fill: "forwards" }).finished.then(finish, finish);
        return;
      }
      const from = logo.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const s = to.width / from.width;
      meta.forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }));
      bg?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: 180, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
      logo
        .animate(
          [
            { transform: "none" },
            { transform: `translate(${dx * 0.08}px, ${dy * 0.08 - 12}px) scale(1.04)`, offset: 0.22 },
            { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
          ],
          { duration: 820, delay: 120, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" },
        )
        .finished.then(finish, finish);
    };

    const tick = () => {
      const p = progress();
      shown += ((p.ready ? 1 : Math.min(0.96, p.value)) - shown) * 0.12;
      paint(shown);
      if (p.ready && !leaving && shown > 0.985) leave();
      else if (!leaving) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
