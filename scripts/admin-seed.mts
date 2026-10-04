// Creates the single owner account from ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD (.env.local only).
// The password must be changed at first login.
//   npm run admin:seed            create the owner if none exists
//   npm run admin:seed -- --reset set the password back to the seed value, force a change, sign out everywhere
import { hash } from "@node-rs/argon2";
import { eq, isNull } from "drizzle-orm";
import { db, schema } from "./_db.mts";

const username = (process.env.ADMIN_SEED_USERNAME ?? "").trim().toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD ?? "";
const reset = process.argv.includes("--reset");

if (!username || !password) {
  console.error("Set ADMIN_SEED_USERNAME and ADMIN_SEED_PASSWORD in .env.local first.");
  process.exit(1);
}
if (!/^[a-z0-9_.-]{3,40}$/.test(username)) {
  console.error("ADMIN_SEED_USERNAME must be 3–40 chars: a-z, 0-9, _ . -");
  process.exit(1);
}

const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
const existing = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1);

if (existing.length && !reset) {
  console.log("The owner account already exists. Nothing to do (use --reset to restore the seed password).");
} else if (existing.length && reset) {
  const id = existing[0].id;
  await db.batch([
    db
      .update(schema.adminUsers)
      .set({ passwordHash, mustChangePassword: true, failedLoginCount: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, id)),
    db
      .update(schema.adminSessions)
      .set({ revokedAt: new Date() })
      .where(isNull(schema.adminSessions.revokedAt)),
    db.insert(schema.activityLog).values({ adminUserId: id, action: "auth.password_reset_cli" }),
  ]);
  console.log("Password reset to the seed value. You'll be asked to change it at the next login.");
} else {
  const [row] = await db
    .insert(schema.adminUsers)
    .values({ username, passwordHash, mustChangePassword: true })
    .returning({ id: schema.adminUsers.id });
  await db.insert(schema.activityLog).values({ adminUserId: row.id, action: "auth.owner_seeded" });
  console.log("Owner account created. Sign in at /admin/login and change the password.");
}
