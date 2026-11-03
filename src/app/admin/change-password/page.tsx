import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await requireAdmin({ allowRestricted: true });
  const forced = session.user.mustChangePassword;
  return (
    <AuthCard title={forced ? "Set your own password" : "Change password"} foot={forced ? <span /> : <Link href="/admin">← Back to the dashboard</Link>}>
      {forced ? <p className="form-hint auth-card__intro">For security, change the temporary password before using the admin panel.</p> : null}
      <PasswordForm username={session.user.username} forced={forced} />
    </AuthCard>
  );
}
