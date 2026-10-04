"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { isCalm, onMotionChange, scrollVelocity } from "@/lib/motion";

/**
 * Marquee ribbon (kotoha): drifts slowly, speeds up with scroll speed and reverses when scrolling up.
 * Runs only while visible and in full motion. The second copy is aria-hidden.
 */
export function Marquee({ children, speed = 34, className = "", label }: { children: ReactNode; speed?: number; className?: string; label?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    const first = tr?.firstElementChild as HTMLElement | null;
    if (!el || !tr || !first) return;
    let x = 0;
    let dir = -1;
    let last = 0;
    let raf = 0;
    let visible = false;
    let width = first.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => (width = first.getBoundingClientRect().width));
    ro.observe(first);

    const frame = (t: number) => {
      const dt = Math.min(0.064, (t - last) / 1000);
      last = t;
      const v = scrollVelocity();
      if (Math.abs(v) > 0.05) dir = v > 0 ? -1 : 1;
      x += dir * speed * (1 + Math.min(7, Math.abs(v) * 2.4)) * dt;
      if (width > 0) {
        if (x <= -width) x += width;
        else if (x > 0) x -= width;
      }
      tr.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (raf || !visible || isCalm() || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) run();
      else stop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVis);
    const off = onMotionChange((mode) => {
      if (mode === "calm") {
        stop();
        tr.style.transform = "";
      } else run();
    });
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      off();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [speed]);

  return (
    <div ref={root} className={`marquee ${className}`} role={label ? "region" : undefined} aria-label={label}>
      <div ref={track} className="marquee__track">
        <div className="marquee__group">{children}</div>
        <div className="marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
