"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { isCalm, saveData } from "@/lib/motion";

/**
 * History archive hover preview (plan §8.2): a floating muted video (~480p) follows the cursor over a row
 * with `data-preview` (mp4 URL) and `data-poster`; it also appears beside a row whose link has keyboard focus.
 * Desktop pointers only; calm mode / Save-Data show the poster still.
 */
export function HoverPreview({ children, className = "" }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const bx = box.current;
    const vd = video.current;
    if (!el || !bx || !vd) return;
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    let active: HTMLElement | null = null;
    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let tilt = 0;

    const frame = () => {
      const dx = tx - x;
      x += dx * 0.18;
      y += (ty - y) * 0.18;
      tilt += (Math.max(-8, Math.min(8, dx * 0.12)) - tilt) * 0.2;
      bx.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      raf = Math.abs(dx) + Math.abs(ty - y) > 0.3 || Math.abs(tilt) > 0.05 ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const show = (row: HTMLElement) => {
      if (active === row) return;
      active = row;
      const src = row.dataset.preview;
      const poster = row.dataset.poster;
      if (!src && !poster) return hide();
      if (label.current) label.current.textContent = row.dataset.title ?? "";
      if (poster) vd.poster = poster;
      if (src && vd.dataset.src !== src) {
        vd.dataset.src = src;
        vd.src = src;
      }
      bx.dataset.show = "1";
      if (src && !isCalm() && !saveData()) vd.play().catch(() => undefined);
    };
    const hide = () => {
      active = null;
      bx.dataset.show = "0";
      vd.pause();
    };
    const place = (cx: number, cy: number, jump = false) => {
      const r = el.getBoundingClientRect();
      const w = bx.offsetWidth;
      const h = bx.offsetHeight;
      tx = Math.min(r.width - w, Math.max(0, cx - r.left + 28));
      ty = cy - r.top - h / 2;
      if (jump) {
        x = tx;
        y = ty;
      }
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (!desktop.matches || e.pointerType !== "mouse") return;
      const row = (e.target as Element).closest<HTMLElement>("[data-row]");
      if (!row) return hide();
      const first = active === null;
      show(row);
      place(e.clientX, e.clientY, first);
    };
    const onFocus = (e: FocusEvent) => {
      if (!desktop.matches) return;
      const row = (e.target as Element).closest<HTMLElement>("[data-row]");
      if (!row) return;
      show(row);
      const rr = row.getBoundingClientRect();
      place(rr.left + rr.width * 0.55, rr.top + rr.height / 2, true);
    };
    const onLeave = () => hide();
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) hide();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocus);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocus);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <div ref={root} className={`hover-preview-host ${className}`}>
      {children}
      <div ref={box} className="hpreview" data-show="0" aria-hidden="true">
        <video ref={video} muted loop playsInline preload="none" disablePictureInPicture />
        <span ref={label} className="hpreview__label" />
      </div>
    </div>
  );
}
