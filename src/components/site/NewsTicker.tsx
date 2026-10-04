"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isCalm } from "@/lib/motion";

export type TickerItem = { date: string; iso?: string; text: string; href: string };

/** HSL-style NEWS bar: "NEWS" pill + rotating updates. Pauses on hover / focus and in calm mode. */
export function NewsTicker({ items }: { items: TickerItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = window.setInterval(() => {
      if (!isCalm() && !document.hidden) setIndex((i) => (i + 1) % items.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (!items.length) return null;
  return (
    <div className="ticker" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Link className="ticker__pill" href="/#news">
        News
      </Link>
      <div className="ticker__viewport" aria-live="off">
        {items.map((item, i) => (
          <Link
            key={item.href + i}
            className="ticker__item"
            href={item.href}
            data-state={i === index ? "on" : i === (index - 1 + items.length) % items.length ? "prev" : "next"}
            tabIndex={i === index ? 0 : -1}
            aria-hidden={i === index ? undefined : true}
          >
            <time dateTime={item.iso}>{item.date}</time>
            <span className="ticker__sep" aria-hidden="true">
              /
            </span>
            <span className="ticker__text">{item.text}</span>
          </Link>
        ))}
      </div>
      {items.length > 1 ? (
        <span className="ticker__count" aria-hidden="true">
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
      ) : null}
    </div>
  );
}
