"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { isCalm, onMotionChange, onScrollVelocity } from "@/lib/motion";

/**
 * Marquee ribbon (kotoha): drifts slowly, speeds up with scroll speed and reverses when scrolling up.
 * One looping Web Animation on the compositor (no per-frame JavaScript): the track holds two identical groups, so
 * translating it by −50 % loops seamlessly; scroll speed only changes the playback rate (negative = reversed).
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
    let anim: Animation | null = null;
    let duration = 0; // ms for one group width at the base speed
    let dir = 1; // +1 = drifting left (scrolling down), −1 = right (scrolling up)
    let rate = 1;
    let visible = false;

    const measure = () => Math.max(1, (first.getBoundingClientRect().width / speed) * 1000);
    const create = () => {
      duration = measure();
      anim = tr.animate([{ transform: "translate3d(0, 0, 0)" }, { transform: "translate3d(-50%, 0, 0)" }], { duration, iterations: Infinity });
      // start far from 0 so playing backwards (scrolling up) never reaches the start of the timeline
      anim.currentTime = duration * 10_000;
      anim.playbackRate = rate;
      anim.pause();
    };
    const run = () => {
      if (!visible || isCalm() || document.hidden) return;
      if (!anim) create();
      anim!.play();
    };
    const stop = () => anim?.pause();

    const offVelocity = onScrollVelocity((v) => {
      if (Math.abs(v) > 0.05) dir = v > 0 ? 1 : -1;
      const next = dir * (1 + Math.min(7, Math.abs(v) * 2.4));
      if (anim && Math.abs(next - rate) > 0.02) anim.updatePlaybackRate(next);
      rate = next;
    });
    const ro = new ResizeObserver(() => {
      if (!anim) return;
      const t = Number(anim.currentTime ?? 0);
      const progress = (t % duration) / duration; // keep the position, only the loop length changes
      duration = measure();
      anim.effect?.updateTiming({ duration });
      anim.currentTime = duration * (10_000 + progress);
    });
    ro.observe(first);
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
        anim?.cancel(); // back to the resting position, like before
        anim = null;
      } else run();
    });
    return () => {
      anim?.cancel();
      offVelocity();
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
