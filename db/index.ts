import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle({ client: sql });
export * as schema from "./schema";
export * as auth from "./auth-schema";
