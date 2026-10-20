import { hash, verify } from "@node-rs/argon2";
import { createHash } from "node:crypto";

// argon2id at or above OWASP's minimum (19 MiB, t=2, p=1). @node-rs/argon2 defaults to argon2id.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Verifying against a real hash when the user doesn't exist keeps timing the same either way.
let dummyHash: Promise<string> | null = null;
export async function burnVerify(password: string) {
  dummyHash ??= hashPassword("moekoworks-dummy-password-for-timing");
  await verifyPassword(await dummyHash, password);
}

// Kotoha's rules (plan §10.3). Client mirrors the first four; "guessable" and "leaked" are server-only.
export type PasswordRule = "min_length" | "max_length" | "contains_username" | "same_as_current" | "guessable" | "leaked";

const SITE_WORDS = ["moekoworks", "moeko", "works", "moemori", "kyle", "zoleta", "flower", "password", "admin", "software", "technologies"];

export async function checkPasswordRules(username: string, current: string, next: string): Promise<PasswordRule[]> {
  const failed: PasswordRule[] = [];
  if (next.length < 12) failed.push("min_length");
  if (next.length > 128) failed.push("max_length");
  if (username && next.toLowerCase().includes(username.toLowerCase())) failed.push("contains_username");
  if (current && next === current) failed.push("same_as_current");

  // "Only site words": strip known words, digits and punctuation; too little left means it's guessable.
  let rest = next.toLowerCase();
  for (const w of SITE_WORDS) rest = rest.split(w).join("");
  if (rest.replace(/[^a-z]/g, "").length < 4) failed.push("guessable");

  if (!failed.includes("min_length") && (await isLeaked(next))) failed.push("leaked");
  return failed;
}

// Have I Been Pwned k-anonymity range API: only the first 5 SHA-1 hex chars leave the server.
async function isLeaked(password: string) {
  const digest = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "moekoworks-admin" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return false; // fail open: the service being down must not lock you out
    const text = await res.text();
    return text.split("\n").some((line) => {
      const [hashSuffix, count] = line.trim().split(":");
      return hashSuffix === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
