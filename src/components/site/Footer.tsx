import Link from "next/link";
import { GiantWord } from "@/components/decor/Decor";
import { site } from "@/lib/site";
import { Socials } from "./Sidebar";

export function Footer() {
  return (
    <footer className="footer">
      <GiantWord className="footer__giant" tone="pink">
        MOESOFT
      </GiantWord>
      <div className="footer__inner">
        <div className="footer__brand">
          <img src="/brand/moesoft-logo.svg" alt="" width={190} height={60} loading="lazy" />
          <p className="footer__name">{site.legalName}</p>
          <p className="footer__tag">{site.tagline}</p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <ul>
            <li>
              <a href="#top" data-page-top>
                Back to top
              </a>
            </li>
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
          </ul>
        </nav>
        <div className="footer__social">
          <p className="micro">Find me on</p>
          <Socials />
        </div>
      </div>
      <p className="footer__legal">
        © {site.since} {site.legalName} · <Link href="/privacy">Privacy</Link>
      </p>
    </footer>
  );
}
