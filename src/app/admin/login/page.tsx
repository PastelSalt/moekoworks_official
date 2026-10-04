import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.restricted ? "/admin/change-password" : "/admin");
  return (
    <main className="admin-auth">
      <div className="admin-auth__card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="admin-auth__logo" src="/brand/moesoft-logo.svg" alt="Moesoft" width={210} height={66} />
        <p className="admin-auth__label">Admin · sign in</p>
        <LoginForm />
      </div>
    </main>
  );
}
