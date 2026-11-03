import type { ReactNode } from "react";
import { navItem } from "./nav";
import { Sticker } from "./Sticker";

/** Kotoha page head: "No.xx — SECTION" micro label, sticker title, hint in a paper pill, actions on the right. */
export function AdminPageHead({ href, title, hint, actions, back }: { href: string; title?: ReactNode; hint?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  const item = navItem(href);
  return (
    <header className="apage-head">
      <div className="apage-head__text">
        {back}
        <p className="alabel">
          <span className="alabel__no">{item.no}</span>
          <span className="alabel__dash" aria-hidden="true" />
          {item.label}
        </p>
        <Sticker as="h1">{title ?? item.label}</Sticker>
        {hint ? <p className="apage-head__hint">{hint}</p> : null}
      </div>
      {actions ? <div className="atoolbar apage-head__actions">{actions}</div> : null}
    </header>
  );
}
