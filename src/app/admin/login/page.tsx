import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.restricted ? "/admin/change-password" : "/admin");
  return (
    <AuthCard title="Admin sign in">
      <LoginForm />
    </AuthCard>
  );
}
