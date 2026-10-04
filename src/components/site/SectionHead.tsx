import type { ReactNode } from "react";
import { PopText } from "@/components/decor/Decor";

/** "No.02 — WORKS" micro-label + tracked title (letter-pop) + long underline; optional action on the right. */
export function SectionHead({ no, label, title, id, action, intro, as: Tag = "h2" }: { no?: string; label: string; title: string; id?: string; action?: ReactNode; intro?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <header className="shead">
      <p className="shead__label">
        {no ? <span className="shead__no">{no}</span> : null}
        <span className="shead__dash" aria-hidden="true" />
        {label}
      </p>
      <div className="shead__row">
        <Tag className="shead__title" id={id}>
          <PopText text={title} />
        </Tag>
        {action}
      </div>
      <span className="shead__rule" aria-hidden="true" />
      {intro ? <p className="shead__intro">{intro}</p> : null}
    </header>
  );
}
