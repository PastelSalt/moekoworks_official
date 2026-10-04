import { ArrowUpRight, BookOpen, CirclePlay, FileText, Globe, Laptop, Link as LinkIcon, type LucideIcon, Monitor, Smartphone, Store } from "lucide-react";
import type { Link } from "@/server/queries/public";

// CTA matrix (plan §9.5). There is no source-code link kind, ever.
export const LINK_META: Record<string, { label: string; icon: LucideIcon; download?: boolean }> = {
  live: { label: "Visit website", icon: Globe },
  apk: { label: "Download APK", icon: Smartphone, download: true },
  play_store: { label: "Get it on Google Play", icon: Store },
  app_store: { label: "Download on the App Store", icon: Store },
  ios: { label: "Get the iOS app", icon: Smartphone },
  exe: { label: "Download for Windows", icon: Monitor, download: true },
  msi: { label: "Download for Windows", icon: Monitor, download: true },
  dmg: { label: "Download for macOS", icon: Laptop, download: true },
  appimage: { label: "Download for Linux", icon: Laptop, download: true },
  docs: { label: "Documentation", icon: BookOpen },
  paper: { label: "Read the paper", icon: FileText },
  demo_video: { label: "Watch demo", icon: CirclePlay },
  other: { label: "Open link", icon: LinkIcon },
};

const host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Event-ticket CTAs with a perforated stub (Miku Expo tour sites). */
export function Ticket({ link, compact = false, projectId }: { link: Link; compact?: boolean; projectId?: number }) {
  const meta = LINK_META[link.kind] ?? LINK_META.other;
  const Icon = meta.icon;
  const label = link.label || meta.label;
  return (
    <a
      className={`ticket ${compact ? "ticket--compact" : ""}`}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      data-track="project_link_click"
      data-track-id={projectId}
      data-track-target={link.kind}
    >
      <span className="ticket__main">
        <span className="ticket__icon" aria-hidden="true">
          <Icon size={compact ? 18 : 22} strokeWidth={2} />
        </span>
        <span className="ticket__text">
          {!compact ? <span className="ticket__kind">{meta.download ? "External download" : "Access"}</span> : null}
          <span className="ticket__label">{label}</span>
          {!compact ? <span className="ticket__url">{link.note || host(link.url)}</span> : null}
        </span>
      </span>
      <span className="ticket__stub" aria-hidden="true">
        <ArrowUpRight size={compact ? 18 : 22} />
      </span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export function ComingSoonTicket() {
  return (
    <span className="ticket ticket--soon" aria-disabled="true">
      <span className="ticket__main">
        <span className="ticket__icon" aria-hidden="true">
          <Globe size={22} />
        </span>
        <span className="ticket__text">
          <span className="ticket__kind">Access</span>
          <span className="ticket__label">Coming soon</span>
        </span>
      </span>
      <span className="ticket__stub" aria-hidden="true">
        ✿
      </span>
    </span>
  );
}
