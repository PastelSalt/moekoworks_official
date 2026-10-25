import { Flower2, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Shared empty / error state: icon + text + optional link button. `small` for inside cards. */
export function StateBox({
  children,
  tone = "empty",
  small = false,
  icon,
  action,
}: {
  children: ReactNode;
  tone?: "empty" | "error";
  small?: boolean;
  icon?: LucideIcon;
  action?: { href: string; label: string };
}) {
  const Icon = icon ?? (tone === "error" ? TriangleAlert : Flower2);
  return (
    <div className={`state state--${tone}${small ? " state--sm" : ""}`} role={tone === "error" ? "alert" : undefined}>
      <span className="state__icon" aria-hidden="true">
        <Icon size={small ? 18 : 26} />
      </span>
      <p className="state__text">{children}</p>
      {action ? (
        <Link className="state__action" href={action.href}>
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
