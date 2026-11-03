import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type IconTone = "content" | "visitors" | "messages" | "danger" | "account";

/** Kotoha list row: thumbnail or icon square · title, meta line, text · actions. Drafts are sunken with a dashed edge. */
export function AdminItem({
  thumb,
  thumbShape = "wide",
  icon: Icon,
  iconTone = "content",
  iconNode,
  title,
  meta,
  text,
  actions,
  draft = false,
  muted = false,
}: {
  thumb?: string | null;
  thumbShape?: "wide" | "card";
  icon?: LucideIcon;
  iconTone?: IconTone;
  iconNode?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
  draft?: boolean;
  muted?: boolean;
}) {
  return (
    <article className={`item${draft ? " item--draft" : ""}${muted ? " item--muted" : ""}${actions ? "" : " item--plain"}`}>
      {thumb ? (
        <span className={`item__thumb item__thumb--${thumbShape}`} style={{ backgroundImage: `url(${thumb})` }} aria-hidden="true" />
      ) : (
        <span className={`item__icon item__icon--${iconTone}`} aria-hidden="true">
          {iconNode ?? (Icon ? <Icon /> : null)}
        </span>
      )}
      <div className="item__main">
        <div className="item__title">{title}</div>
        {meta ? <div className="item__meta">{meta}</div> : null}
        {text ? <p className="item__text">{text}</p> : null}
      </div>
      {actions ? <div className="item__actions">{actions}</div> : null}
    </article>
  );
}
