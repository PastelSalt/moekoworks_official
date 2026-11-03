"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useTransition } from "react";

const Pending = createContext<(href: string) => void>(() => undefined);

/** Everything the range control affects. While a new range loads, it stays on screen at 55% (Kotoha). */
export function RangeScope({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (href: string) => start(() => router.push(href, { scroll: false }));
  return (
    <Pending.Provider value={go}>
      <div className={`range-scope${pending ? " is-pending" : ""}`} aria-busy={pending || undefined}>
        {children}
      </div>
    </Pending.Provider>
  );
}

/** Kotoha's range bar: "Details for:" + segmented ranges + the visits in this period. */
export function RangeBar({ options, note }: { options: { href: string; label: string; active: boolean }[]; note: ReactNode }) {
  const go = useContext(Pending);
  return (
    <div className="paper range-bar">
      <h2>
        <SlidersHorizontal aria-hidden />
        <span>Details for:</span>
      </h2>
      <nav className="segmented" aria-label="Range">
        {options.map((o) => (
          <a
            key={o.href}
            href={o.href}
            className="segmented__item"
            aria-current={o.active ? "page" : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              go(o.href);
            }}
          >
            {o.label}
          </a>
        ))}
      </nav>
      <span className="form-hint">{note}</span>
    </div>
  );
}
