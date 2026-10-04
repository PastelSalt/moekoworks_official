import type { Metadata } from "next";
import Link from "next/link";
import { PatternStage } from "@/components/decor/Decor";
import { SiteShell } from "@/components/site/SiteShell";
import "@/styles/pages.css";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <SiteShell>
      <PatternStage as="section" className="lost" data-track-view="not_found">
        <div className="lost__card paper">
          <p className="lost__code" aria-hidden="true">
            404
          </p>
          <h1 className="lost__title">This page wandered off the flower bed ✿</h1>
          <p className="micro">The link may be old, or the page has moved.</p>
          <div className="lost__actions">
            <Link className="btn" href="/">
              Home
            </Link>
            <Link className="btn btn--white" href="/history">
              History
            </Link>
          </div>
        </div>
      </PatternStage>
    </SiteShell>
  );
}
