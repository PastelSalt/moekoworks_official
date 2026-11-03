import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Kotoha KPI card: icon + label, big number, small sub line. `tone` = visitors (blue), content (pink) or messages. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "visitors",
  href,
  small = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "visitors" | "content" | "messages";
  href?: string;
  small?: boolean;
}) {
  return (
    <div className={`kpi kpi--${tone}${small ? " kpi--small" : ""}`}>
      <p className="kpi__label">
        <Icon aria-hidden />
        <span>{label}</span>
      </p>
      <p className="kpi__value">{href ? <Link href={href}>{value}</Link> : value}</p>
      {sub ? <p className="kpi__sub">{sub}</p> : null}
    </div>
  );
}
