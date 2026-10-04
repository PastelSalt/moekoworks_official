"use client";

import { useEffect, useRef } from "react";
import { scrollToY } from "@/lib/motion";

/** Round PAGE TOP flower (HSL) with a scroll-progress ring; appears after the first screen. */
export function PageTop() {
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = btn.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty("--progress", p.toFixed(4));
      el.dataset.show = window.scrollY > window.innerHeight * 0.6 ? "1" : "0";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Footer "Back to top" links share the same smooth jump.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("[data-page-top]");
      if (!a) return;
      e.preventDefault();
      scrollToY(0);
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <button ref={btn} type="button" className="pagetop" data-show="0" onClick={() => scrollToY(0)} aria-label="Back to top">
      <svg className="pagetop__ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" pathLength="1" className="pagetop__track" />
        <circle cx="50" cy="50" r="46" pathLength="1" className="pagetop__bar" />
      </svg>
      <span className="pagetop__flower" aria-hidden="true">
        <img src="/brand/flower-pink.svg" alt="" width={64} height={64} loading="lazy" />
      </span>
      <span className="pagetop__label" aria-hidden="true">
        Page top
      </span>
    </button>
  );
}
