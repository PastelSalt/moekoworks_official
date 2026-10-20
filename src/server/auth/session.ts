import "server-only";

import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/server/db";

const SESSION_DAYS = 7;
const IDLE_MS = 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 5 * 60 * 1000;

// __Host- requires Secure; plain name on http://localhost during development.
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mw_session" : "mw_session";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function hashIp(ip: string) {
  return createHmac("sha256", process.env.HASH_PEPPER ?? "dev-pepper").update(ip).digest("base64url").slice(0, 32);
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
}

export async function createSession(adminUserId: number, restricted: boolean) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await db.insert(schema.adminSessions).values({ adminUserId, tokenHash: sha256(token), restricted, expiresAt, userAgent });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export type AdminSession = {
  sessionId: number;
  restricted: boolean;
  user: { id: number; username: string; mustChangePassword: boolean };
};

// One lookup per request (React cache); proxy.ts only does the optimistic cookie check.
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date();
  const [row] = await db
    .select({
      sessionId: schema.adminSessions.id,
      restricted: schema.adminSessions.restricted,
      lastSeenAt: schema.adminSessions.lastSeenAt,
      userId: schema.adminUsers.id,
      username: schema.adminUsers.username,
      mustChangePassword: schema.adminUsers.mustChangePassword,
    })
    .from(schema.adminSessions)
    .innerJoin(schema.adminUsers, eq(schema.adminUsers.id, schema.adminSessions.adminUserId))
    .where(
      and(
        eq(schema.adminSessions.tokenHash, sha256(token)),
        isNull(schema.adminSessions.revokedAt),
        gt(schema.adminSessions.expiresAt, now),
      ),
    )
    .limit(1);
  if (!row) return null;
  if (now.getTime() - row.lastSeenAt.getTime() > IDLE_MS) return null;
  if (now.getTime() - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await db.update(schema.adminSessions).set({ lastSeenAt: now }).where(eq(schema.adminSessions.id, row.sessionId));
  }
  return {
    sessionId: row.sessionId,
    restricted: row.restricted || row.mustChangePassword,
    user: { id: row.userId, username: row.username, mustChangePassword: row.mustChangePassword },
  };
});

/** For admin pages and actions. Restricted sessions (first login) may only reach the password change. */
export async function requireAdmin({ allowRestricted = false } = {}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.restricted && !allowRestricted) redirect("/admin/change-password");
  return session;
}

export async function revokeSession(sessionId: number) {
  await db.update(schema.adminSessions).set({ revokedAt: new Date() }).where(eq(schema.adminSessions.id, sessionId));
}

export async function revokeOtherSessions(adminUserId: number, keepSessionId: number) {
  await db
    .update(schema.adminSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.adminSessions.adminUserId, adminUserId),
        ne(schema.adminSessions.id, keepSessionId),
        isNull(schema.adminSessions.revokedAt),
      ),
    );
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function logActivity(adminUserId: number | null, action: string, summary?: string, meta: object = {}) {
  await db.insert(schema.activityLog).values({ adminUserId, action, summary, meta });
}
