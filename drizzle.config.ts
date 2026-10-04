import { defineConfig } from "drizzle-kit";

// Migrations use the direct (unpooled) connection from .env.local.
try {
  process.loadEnvFile(".env.local");
} catch {
  // On CI/Vercel the variables come from the environment.
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
  strict: true,
  verbose: true,
});
