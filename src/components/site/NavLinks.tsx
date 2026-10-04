"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";

/** ABOUT · CONTACT · HISTORY with sub-captions; the current section sits on the pink pill. */
export function NavLinks({ variant, onNavigate }: { variant: "sidebar" | "sheet"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className={`navlist navlist--${variant}`}>
      {site.nav.map((item, i) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link className="navlink" href={item.href} aria-current={active ? "page" : undefined} onClick={onNavigate}>
              {variant === "sheet" ? <span className="navlink__no">{`0${i + 1}`}</span> : null}
              <span className="navlink__label">{item.label}</span>
              <span className="navlink__caption">{item.caption}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
