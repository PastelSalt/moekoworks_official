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
        <img className="admin-auth__logo" src="/brand/moesoft-logo.svg" alt="Moesoft" width={210} height={66} />
        <p className="admin-auth__label">{forced ? "Please set your own password" : "Change password"}</p>
        {forced && (
          <p style={{ marginTop: 0, color: "var(--ink-soft)", textAlign: "center" }}>
            For security, change the temporary password before using the admin panel.
          </p>
        )}
        <PasswordForm username={session.user.username} forced={forced} />
        {!forced && (
          <p style={{ textAlign: "center", marginBottom: 0 }}>
            <Link href="/admin">← Back to the dashboard</Link>
          </p>
        )}
      </div>
    </main>
  );
}
