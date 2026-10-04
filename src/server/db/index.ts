import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// One-shot queries over HTTP (fast cold starts). Multi-statement writes use db.batch([...]), which is atomic.
export const db = drizzle({ client: neon(url), schema });
export { schema };
