import { ChartColumn, KeyRound, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { CountMyVisits } from "@/components/admin/CountMyVisits";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { Flower } from "@/components/admin/Sticker";
import { logoutOthersAction } from "@/server/auth/actions";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  return (
    <>
      <AdminPageHead href="/admin/account" />
      <section className="panel account-card">
        <span className="item__icon item__icon--content account-card__avatar" aria-hidden="true">
          <Flower tone="pink" />
        </span>
        <p className="account-card__name">
          <span>{session.user.username}</span>
          <span className="apill apill--owner">Owner</span>
        </p>
        <form action={logoutOthersAction} className="account-card__action">
          <button type="submit" className="abtn abtn--ghost">
            <LogOut aria-hidden /> Sign out other devices
          </button>
        </form>
        <p className="form-hint account-card__hint">Signed in somewhere you don&apos;t recognise? Sign out every other device. This one stays signed in.</p>
      </section>
      <div className="account-grid">
        <section className="panel">
          <h2>
            <KeyRound aria-hidden />
            <span>Change password</span>
          </h2>
          <PasswordForm username={session.user.username} />
        </section>
        <section className="panel">
          <h2>
            <ChartColumn aria-hidden />
            <span>Statistics</span>
          </h2>
          <p className="form-hint">While you&apos;re signed in, your visits are never counted. Turn this on to keep this browser out of the statistics even after you sign out.</p>
          <CountMyVisits />
        </section>
      </div>
    </>
  );
}
