import Link from "next/link";
import { site } from "@/lib/site";
import { MotionToggle } from "./MotionToggle";
import { NavLinks } from "./NavLinks";
import { SocialIcon } from "./SocialIcon";

export function Socials({ className = "" }: { className?: string }) {
  return (
    <ul className={`socials ${className}`}>
      {site.socials.map((s) => (
        <li key={s.id}>
          <a
            className="socials__link"
            href={s.href}
            aria-label={s.label}
            title={s.label}
            data-track="outbound_click"
            data-track-target={s.id}
            {...(s.id === "email" ? {} : { target: "_blank", rel: "noopener noreferrer me" })}
          >
            <SocialIcon id={s.id} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Fixed white sidebar (Miku Expo): logo, nav with sub-captions, socials, motion toggle, ©. Desktop ≥ 900 px. */
export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Site">
      <Link className="sidebar__logo" href="/" data-splash-target>
        <img src="/brand/moekoworks-logo.svg" alt="Moeko Works home" width={190} height={41} />
      </Link>
      <nav className="sidebar__nav" aria-label="Main">
        <NavLinks variant="sidebar" />
      </nav>
      <div className="sidebar__foot">
        <Socials />
        <MotionToggle />
        <p className="sidebar__copy">© {site.since} Moeko Works</p>
      </div>
    </aside>
  );
}
