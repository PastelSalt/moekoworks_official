import { CircleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Flower } from "./Sticker";

/** Kotoha state box: empty = dashed pink box with a flower; error = red box. `small` for inside cards. */
export function StateBox({
  children,
  tone = "empty",
  small = false,
  icon: Icon,
  action,
}: {
  children: ReactNode;
  tone?: "empty" | "error";
  small?: boolean;
  icon?: LucideIcon;
  action?: ReactNode | { href: string; label: string };
}) {
  const link = action && typeof action === "object" && "href" in action ? action : null;
  return (
    <div className={`state${tone === "error" ? " state--error" : ""}${small ? " state--small" : ""}`} role={tone === "error" ? "alert" : undefined}>
      {tone === "error" ? (
        <CircleAlert className="state__icon" aria-hidden />
      ) : Icon ? (
        <Icon className="state__icon" aria-hidden />
      ) : (
        <Flower tone={small ? "o" : "pink"} className="state__flower" />
      )}
      <p>{children}</p>
      {link ? (
        <Link className="abtn abtn--ghost abtn--sm" href={link.href}>
          {link.label}
        </Link>
      ) : (
        (action as ReactNode)
      )}
    </div>
  );
}
