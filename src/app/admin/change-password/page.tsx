import type { Metadata } from "next";
import Link from "next/link";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await requireAdmin({ allowRestricted: true });
  const forced = session.user.mustChangePassword;
  return (
    <main className="admin-auth">
      <div className="admin-auth__card">
        <span className="atape admin-auth__tape" aria-hidden="true" />
        <span className="atape atape--blue admin-auth__tape admin-auth__tape--end" aria-hidden="true" />
        <img className="admin-auth__logo" src="/brand/moekoworks-logo.svg" alt="Moeko Works" width={210} height={46} />
        <p className="admin-auth__sticker">
          <span className="asticker asticker--pink">{forced ? "Please set your own password" : "Change password"}</span>
        </p>
        {forced && <p className="admin-auth__note">For security, change the temporary password before using the admin panel.</p>}
        <PasswordForm username={session.user.username} forced={forced} />
        {!forced && (
          <p className="admin-auth__back">
            <Link href="/admin">← Back to the dashboard</Link>
          </p>
        )}
      </div>
    </main>
  );
}
