import type { ReactNode } from "react";
import { navItem } from "./nav";

/** "No.xx — Section" micro label + title (+ hint and actions), numbered from the sidebar list. */
export function AdminPageHead({ href, title, hint, actions }: { href: string; title?: ReactNode; hint?: ReactNode; actions?: ReactNode }) {
  const item = navItem(href);
  return (
    <header className="apage-head">
      <div className="apage-head__text">
        <p className="admin-label">
          {item.no} — {item.label}
        </p>
        <h1 className="apage-head__title">{title ?? item.label}</h1>
        {hint ? <p className="apage-head__hint">{hint}</p> : null}
      </div>
      {actions ? <div className="apage-head__actions">{actions}</div> : null}
    </header>
  );
}
