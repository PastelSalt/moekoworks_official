"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/server/db";
import { burnVerify, checkPasswordRules, hashPassword, type PasswordRule, verifyPassword } from "./password";
import {
  clearSessionCookie,
  clientIp,
  createSession,
  getSession,
  hashIp,
  logActivity,
  requireAdmin,
  revokeOtherSessions,
  revokeSession,
} from "./session";

const LOCK_MINUTES = 15;
const MAX_USER_FAILURES = 5;
const MAX_IP_ATTEMPTS = 10;

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const generic = { error: "Incorrect username or password." };
  if (!username || !password || password.length > 256) return generic;

  const ipHash = hashIp(await clientIp());
  const since = new Date(Date.now() - LOCK_MINUTES * 60 * 1000);
  const [{ value: ipAttempts }] = await db
    .select({ value: count() })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.ipHash, ipHash), gt(schema.loginAttempts.attemptedAt, since)));
  if (ipAttempts >= MAX_IP_ATTEMPTS) return { error: "Too many attempts. Please wait 15 minutes and try again." };

  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username)).limit(1);
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await db.insert(schema.loginAttempts).values({ ipHash, usernameAttempted: username, succeeded: false });
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const ok = user ? await verifyPassword(user.passwordHash, password) : (await burnVerify(password), false);
  await db.insert(schema.loginAttempts).values({ ipHash, usernameAttempted: username, succeeded: ok });

  if (!user || !ok) {
    if (user) {
      const failures = user.failedLoginCount + 1;
      await db
        .update(schema.adminUsers)
        .set({
          failedLoginCount: failures,
          lockedUntil: failures >= MAX_USER_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
        })
        .where(eq(schema.adminUsers.id, user.id));
      await logActivity(user.id, "auth.login_failed", failures >= MAX_USER_FAILURES ? "Locked for 15 minutes" : undefined);
    }
    return generic;
  }

  await db
    .update(schema.adminUsers)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));
  await createSession(user.id, user.mustChangePassword);
  await logActivity(user.id, "auth.login");
  redirect(user.mustChangePassword ? "/admin/change-password" : "/admin");
}

export type PasswordState = { error?: string; failed?: PasswordRule[]; done?: boolean } | undefined;

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await requireAdmin({ allowRestricted: true });
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (next !== confirm) return { error: "The new passwords don't match." };

  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, session.user.id)).limit(1);
  if (!user || !(await verifyPassword(user.passwordHash, current))) return { error: "The current password is incorrect." };

  const failed = await checkPasswordRules(user.username, current, next);
  if (failed.length) return { error: "Please check the rules below.", failed };

  const wasForced = user.mustChangePassword;
  await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false, passwordChangedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));
  // Sign out everywhere else. After the forced first-login change the restricted session is swapped for a
  // full one (the redirect carries the new cookie); a normal change keeps this device's session.
  await revokeOtherSessions(user.id, session.sessionId);
  await logActivity(user.id, "auth.password_change", wasForced ? "First-login change" : undefined);
  if (wasForced) {
    await revokeSession(session.sessionId);
    await createSession(user.id, false);
    redirect("/admin?welcome=1");
  }
  return { done: true };
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await revokeSession(session.sessionId);
    await logActivity(session.user.id, "auth.logout");
  }
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function logoutOthersAction() {
  const session = await requireAdmin();
  await revokeOtherSessions(session.user.id, session.sessionId);
  await logActivity(session.user.id, "auth.logout_others");
}
