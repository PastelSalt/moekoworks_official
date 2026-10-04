// Database client for CLI scripts (no "server-only"; reads .env.local).
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/server/db/schema.ts";

try {
  process.loadEnvFile(".env.local");
} catch {
  // variables may already be in the environment
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL_UNPOOLED in .env.local first.");
  process.exit(1);
}

export const db = drizzle({ client: neon(url), schema });
export { schema };
