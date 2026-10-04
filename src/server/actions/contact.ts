"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { clientIp, hashIp } from "@/server/auth/session";
import { db, schema } from "@/server/db";

// Contact form (plan §13): honeypot, signed start time (≥ 3 s to fill), 5 messages / hour / visitor,
// ≤ 3 links. Suspicious messages are kept but land in Spam instead of being rejected outright.
const MIN_FILL_MS = 3000;
const PER_HOUR = 5;

export type ContactField = "name" | "email" | "subject" | "message";
export type ContactState = { ok?: boolean; error?: string; fields?: Partial<Record<ContactField, string>>; values?: Record<ContactField, string> } | undefined;

const Message = z.object({
  name: z.string().trim().min(1, "Please tell me your name.").max(100, "That name is a bit long (100 characters max)."),
  email: z.string().trim().max(254, "That e-mail address is too long.").pipe(z.email("Please check your e-mail address.")),
  subject: z.string().trim().min(3, "A short subject helps (3 characters or more).").max(150, "Please keep the subject under 150 characters."),
  message: z.string().trim().min(10, "Your message is a little short (10 characters or more).").max(5000, "Please keep it under 5,000 characters."),
});

const sign = (ts: string) => createHmac("sha256", process.env.HASH_PEPPER ?? "dev-pepper").update(`contact:${ts}`).digest("base64url").slice(0, 32);

/** Issued when the visitor starts typing; proves the form wasn't filled by a script in under 3 seconds. */
export async function contactToken() {
  const ts = String(Date.now());
  return `${ts}.${sign(ts)}`;
}

function checkToken(token: string): { tooFast: boolean; score: number } {
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return { tooFast: false, score: 2 }; // no JavaScript: still accepted (plan §8.4), but scored
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { tooFast: false, score: 4 };
  const age = Date.now() - Number(ts);
  if (age < MIN_FILL_MS) return { tooFast: true, score: 0 };
  return { tooFast: false, score: age > 24 * 60 * 60 * 1000 ? 1 : 0 };
}

async function overLimit(keyHash: string) {
  const windowStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ bucket: "contact", keyHash, windowStart, hits: 1 })
    .onConflictDoUpdate({
      target: [schema.rateLimits.bucket, schema.rateLimits.keyHash, schema.rateLimits.windowStart],
      set: { hits: sql`${schema.rateLimits.hits} + 1` },
    })
    .returning({ hits: schema.rateLimits.hits });
  return (row?.hits ?? 0) > PER_HOUR;
}

function describeAgent(ua: string) {
  const deviceType = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : ua ? "desktop" : "unknown";
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /firefox\//i.test(ua) ? "Firefox" : /chrome\//i.test(ua) ? "Chrome" : /safari\//i.test(ua) ? "Safari" : "Other";
  return { deviceType, browser };
}

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
  };
  // Honeypot filled → a bot. Pretend it worked and store nothing.
  if (String(formData.get("website") ?? "")) return { ok: true };

  const token = checkToken(String(formData.get("t") ?? ""));
  if (token.tooFast) return { error: "That was quick! Please take a moment, then send it again.", values };

  const parsed = Message.safeParse(values);
  if (!parsed.success) {
    const fields: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ContactField;
      fields[key] ??= issue.message;
    }
    return { error: "Please check the highlighted fields.", fields, values };
  }

  const ipHash = hashIp(await clientIp());
  if (await overLimit(ipHash)) {
    return { error: "You've sent a few messages already. Please try again in an hour, or e-mail me directly.", values };
  }

  const msg = parsed.data;
  const links = (msg.message.match(/https?:\/\/|www\./gi) ?? []).length;
  let spamScore = token.score;
  if (links > 3) spamScore += 3;
  if (/\b(seo|backlinks?|crypto|casino|loan|viagra)\b/i.test(`${msg.subject} ${msg.message}`)) spamScore += 2;
  if (msg.message.length > 40 && msg.message === msg.message.toUpperCase()) spamScore += 1;

  const h = await headers();
  const { deviceType, browser } = describeAgent(h.get("user-agent") ?? "");
  let referrerHost: string | null = null;
  try {
    const ref = String(formData.get("ref") ?? "");
    referrerHost = ref ? new URL(ref).host.slice(0, 120) : null;
  } catch {
    referrerHost = null;
  }

  try {
    await db.insert(schema.contactMessages).values({
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      body: msg.message,
      status: spamScore >= 5 ? "spam" : "unread",
      spamScore,
      pagePath: "/contact",
      referrerHost,
      country: h.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
      deviceType,
      browser,
    });
  } catch {
    return { error: "Your message couldn't be sent. Please try again, or e-mail me directly.", values };
  }
  return { ok: true };
}
