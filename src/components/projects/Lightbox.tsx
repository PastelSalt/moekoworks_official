"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { getLenis } from "@/lib/motion";

export type LightboxItem = { src: string; srcSet?: string; alt: string; caption?: string; width?: number | null; height?: number | null };

/**
 * Lightbox for galleries and certificates. Tiles stay server-rendered: any descendant with `data-lb="<index>"`
 * opens the viewer at that item. Native <dialog>: focus is trapped, Esc closes, ← / → move.
 */
export function Lightbox({ items, children, className = "", label = "Image viewer" }: { items: LightboxItem[]; children: ReactNode; className?: string; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => {
    setIndex(i);
    dialog.current?.showModal();
    getLenis()?.stop();
  }, []);
  const go = (step: number) => setIndex((i) => (i === null ? i : (i + step + items.length) % items.length));
  const item = index === null ? null : items[index];

  return (
    <div
      className={className}
      onClick={(e) => {
        const tile = (e.target as Element).closest<HTMLElement>("[data-lb]");
        if (tile) open(Number(tile.dataset.lb));
      }}
    >
      {children}
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={label}
        data-lenis-prevent
        onClose={() => {
          setIndex(null);
          getLenis()?.start();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {item ? (
          <figure className="lightbox__figure">
            <img src={item.src} srcSet={item.srcSet} sizes="92vw" alt={item.alt} width={item.width ?? undefined} height={item.height ?? undefined} />
            {item.caption || items.length > 1 ? (
              <figcaption className="lightbox__caption">
                {items.length > 1 ? <span className="lightbox__count">{`${String((index ?? 0) + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}</span> : null}
                {item.caption ? <span>{item.caption}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
        <button type="button" className="lightbox__btn lightbox__close" onClick={() => dialog.current?.close()} aria-label="Close" autoFocus>
          <X size={22} aria-hidden="true" />
        </button>
        {items.length > 1 ? (
          <>
            <button type="button" className="lightbox__btn lightbox__prev" onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <button type="button" className="lightbox__btn lightbox__next" onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
