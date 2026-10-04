"use client";

import Link from "next/link";
import "@/styles/pages.css";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="lost wrap">
      <div className="lost__card paper">
        <p className="lost__code" aria-hidden="true">
          ✿
        </p>
        <h1 className="lost__title">Sorry, something went wrong on this page.</h1>
        <p className="micro">Please try again in a moment.</p>
        <div className="lost__actions">
          <button type="button" className="btn" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn--white" href="/">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
