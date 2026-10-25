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
        <span className="atape admin-auth__tape" aria-hidden="true" />
        <span className="atape atape--blue admin-auth__tape admin-auth__tape--end" aria-hidden="true" />
        <img className="admin-auth__logo" src="/brand/moekoworks-logo.svg" alt="Moeko Works" width={210} height={46} />
        <p className="admin-auth__sticker">
          <span className="asticker asticker--pink">Admin · sign in</span>
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
