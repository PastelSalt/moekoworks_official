"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { FLOWER_VIEWBOX, SHAPES } from "@/components/decor/shapes";
import { getLenis, isCalm, onMotionChange, setLenis, setScrollVelocity, wireMotionPrefs } from "@/lib/motion";

const MAX_LEAN = 2; // degrees

// Cursor-sparkle palette: [shape, fill]
const SPARKS: [keyof typeof SHAPES, string][] = [
  ["spark", "#F8D95A"],
  ["spark", "#FFB4E3"],
  ["spark", "#A0CFFC"],
  ["heart", "#F28AA9"],
  ["flower", "#FFB4E3"],
  ["flower", "#E2A8F2"],
  ["star", "#F8D95A"],
];

/**
 * Owns the site-wide motion: smooth wheel (Lenis, desktop + full motion), scroll velocity → --lean,
 * cursor sparkles (desktop mouse), and the letter pops of section titles. Reveals and parallax are CSS.
 */
export function MotionRoot() {
  const pathname = usePathname();

  // Lenis on fine pointers in full motion; native scrolling everywhere else (plan §7.6).
  useEffect(() => {
    wireMotionPrefs();
    const fine = window.matchMedia("(pointer: fine)");
    let lenis: Lenis | null = null;
    const sync = () => {
      const want = !isCalm() && fine.matches;
      if (want && !lenis) {
        lenis = new Lenis({ autoRaf: true, lerp: 0.11, prevent: (node) => Boolean(node.closest?.("dialog, [data-lenis-prevent]")) });
        setLenis(lenis);
        if (document.documentElement.dataset.splash === "show") lenis.stop();
      } else if (!want && lenis) {
        lenis.destroy();
        lenis = null;
        setLenis(null);
      }
    };
    sync();
    const off = onMotionChange(sync);
    fine.addEventListener("change", sync);
    return () => {
      off();
      fine.removeEventListener("change", sync);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  // Scroll velocity (smoothed px/ms) → --lean on <html>; settles back to 0 when scrolling stops.
  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let velocity = 0;
    let lean = 0;
    let raf = 0;
    const frame = (t: number) => {
      const y = window.scrollY;
      const dt = Math.max(8, t - lastT);
      velocity += ((y - lastY) / dt - velocity) * 0.25;
      lastY = y;
      lastT = t;
      lean += (Math.max(-MAX_LEAN, Math.min(MAX_LEAN, velocity * 1.4)) - lean) * 0.12;
      const settled = Math.abs(lean) < 0.01 && Math.abs(velocity) < 0.003;
      if (settled) velocity = lean = 0;
      setScrollVelocity(velocity);
      root.style.setProperty("--lean", lean.toFixed(3));
      raf = settled ? 0 : requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf || isCalm()) return;
      lastY = window.scrollY;
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener("scroll", wake, { passive: true });
    const off = onMotionChange((mode) => {
      if (mode === "calm") {
        cancelAnimationFrame(raf);
        raf = 0;
        velocity = lean = 0;
        setScrollVelocity(0);
        root.style.setProperty("--lean", "0");
      }
    });
    return () => {
      window.removeEventListener("scroll", wake);
      cancelAnimationFrame(raf);
      off();
    };
  }, []);

  // Cursor sparkles: a pool of ≤ 14 tiny flowers / sparkles / hearts fading behind the mouse (kotoha).
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const NS = "http://www.w3.org/2000/svg";
    const layer = document.createElement("div");
    layer.className = "sparkle-layer";
    layer.setAttribute("aria-hidden", "true");
    const pool = Array.from({ length: 14 }, () => {
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      const path = document.createElementNS(NS, "path");
      svg.append(path);
      layer.append(svg);
      return { svg, path };
    });
    document.body.append(layer);
    let next = 0;
    let last = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || isCalm() || document.documentElement.dataset.splash === "show") return;
      const now = performance.now();
      if (now - last < 42) return;
      last = now;
      const { svg, path } = pool[next];
      next = (next + 1) % pool.length;
      const [shape, fill] = SPARKS[Math.floor(Math.random() * SPARKS.length)];
      path.setAttribute("d", SHAPES[shape]);
      svg.setAttribute("viewBox", shape === "flower" ? FLOWER_VIEWBOX : "0 0 24 24");
      path.setAttribute("fill", fill);
      path.setAttribute("stroke", "#2E2A36");
      path.setAttribute("stroke-width", shape === "spark" ? "0" : "1.2");
      const size = 10 + Math.random() * 8;
      const x = e.clientX - size / 2;
      const y = e.clientY - size / 2;
      const dx = (Math.random() - 0.5) * 36;
      const dy = 12 + Math.random() * 28;
      svg.style.width = svg.style.height = `${size}px`;
      svg.animate(
        [
          { opacity: 0.95, transform: `translate(${x}px, ${y}px) scale(1) rotate(0deg)` },
          { opacity: 0, transform: `translate(${x + dx}px, ${y + dy}px) scale(0.3) rotate(${dx * 5}deg)` },
        ],
        { duration: 780, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      layer.remove();
    };
  }, []);

  // Per page: stop any running smooth scroll, then arm letter pops for titles below the fold.
  useEffect(() => {
    const lenis = getLenis();
    if (lenis && !window.location.hash) {
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    }
    const titles = Array.from(document.querySelectorAll<HTMLElement>(".pop:not(.pop--load):not(.is-in)"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.4, rootMargin: "0px 0px -6% 0px" },
    );
    for (const el of titles) {
      // already on screen when first seen: never hide it (no flicker); otherwise wait and pop in on arrival
      if (!el.classList.contains("pop--wait")) {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) continue;
        el.classList.add("pop--wait");
      }
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
