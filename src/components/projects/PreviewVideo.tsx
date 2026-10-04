"use client";

import { useEffect, useRef } from "react";
import { isCalm, onMotionChange, saveData } from "@/lib/motion";
import { track } from "@/lib/track";

type Props = {
  src: string;
  webm?: string;
  poster?: string;
  /** hover: plays while the closest `[data-hover-host]` is hovered or focused · inview: autoplays while on screen */
  mode: "hover" | "inview";
  className?: string;
  label?: string;
  /** project id for video_play / video_complete statistics */
  trackId?: number;
};

/**
 * One preview video, three uses (plan §9.6): hover previews in lists, the Latest card (in view) and the project hero.
 * Muted, looping, poster first, preload none. Calm mode, Save-Data or a hidden tab keep the poster.
 */
export function PreviewVideo({ src, webm, poster, mode, className = "", label, trackId }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let wanted = false;
    let timer = 0;
    const allowed = () => !isCalm() && !saveData() && !document.hidden;
    const play = () => {
      wanted = true;
      if (!allowed()) return;
      if (video.preload !== "auto") video.preload = "auto";
      video.dataset.playing = "1";
      video.play().catch(() => (video.dataset.playing = "0"));
    };
    const pause = (reset = false) => {
      wanted = false;
      window.clearTimeout(timer);
      video.pause();
      video.dataset.playing = "0";
      if (reset) video.currentTime = 0;
    };
    const cleanups: (() => void)[] = [];

    // statistics: a play counts after 1 s of hover or 3 s of autoplay; completion at 95 %
    let played = false;
    let completed = false;
    let watched = 0;
    let lastT = 0;
    const onTime = () => {
      const t = video.currentTime;
      if (t > lastT && t - lastT < 1.5) watched += t - lastT;
      lastT = t;
      if (!trackId) return;
      if (!played && watched >= (mode === "hover" ? 1 : 3)) {
        played = true;
        track({ t: "video_play", id: trackId, tg: mode === "hover" ? "hover" : "auto" });
      }
      if (!completed && video.duration && t / video.duration >= 0.95) {
        completed = true;
        track({ t: "video_complete", id: trackId, tg: mode === "hover" ? "hover" : "auto" });
      }
    };
    video.addEventListener("timeupdate", onTime);
    cleanups.push(() => video.removeEventListener("timeupdate", onTime));

    if (mode === "hover") {
      const host = (video.closest("[data-hover-host]") as HTMLElement | null) ?? video;
      const enter = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(play, 150);
      };
      const leave = () => pause(true);
      host.addEventListener("pointerenter", enter);
      host.addEventListener("pointerleave", leave);
      host.addEventListener("focusin", enter);
      host.addEventListener("focusout", leave);
      cleanups.push(() => {
        host.removeEventListener("pointerenter", enter);
        host.removeEventListener("pointerleave", leave);
        host.removeEventListener("focusin", enter);
        host.removeEventListener("focusout", leave);
      });
    } else {
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { threshold: 0.35 });
      io.observe(video);
      cleanups.push(() => io.disconnect());
    }
    const onVis = () => (document.hidden ? video.pause() : wanted && play());
    document.addEventListener("visibilitychange", onVis);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVis));
    cleanups.push(onMotionChange((m) => (m === "calm" ? pause(true) : wanted && play())));
    return () => {
      pause();
      cleanups.forEach((fn) => fn());
    };
  }, [mode, trackId]);

  return (
    <video ref={ref} className={`pvideo ${className}`} muted loop playsInline preload="none" poster={poster} aria-label={label} data-playing="0" disablePictureInPicture>
      {webm ? <source src={webm} type="video/webm" /> : null}
      <source src={src} type="video/mp4" />
    </video>
  );
}
