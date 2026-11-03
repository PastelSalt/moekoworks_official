import Link from "next/link";
import type { ReactNode } from "react";
import { Flower, Sticker } from "./Sticker";

/** Kotoha's sign-in card: paper on the dotted page, flowers sticking out of two corners, logo, small sticker title. */
export function AuthCard({ title, children, foot }: { title: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Flower tone="pink" className="auth-card__deco auth-card__deco--a" />
        <Flower tone="purple" className="auth-card__deco auth-card__deco--b" />
        <img className="auth-card__logo" src="/brand/moekoworks-logo.svg" alt="Moeko Works" width={210} height={46} />
        <div className="auth-card__title">
          <Sticker as="h1" small>
            {title}
          </Sticker>
        </div>
        {children}
        <div className="auth-card__foot">
          {foot ?? <Link href="/">← View site</Link>}
          <span className="auth-card__tag">Admin</span>
        </div>
      </div>
    </main>
  );
}
