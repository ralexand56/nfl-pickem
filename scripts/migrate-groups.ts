// scripts/migrate-groups.ts
//
// Applies migrations/0006_groups.sql in a single transaction.
//
// Deliberately does NOT read .env.local, which points at the production
// database. Pass the target explicitly and confirm its host:
//
//   MIGRATE_DATABASE_URL=postgres://... npx tsx scripts/migrate-groups.ts --confirm-host=<host>
import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.MIGRATE_DATABASE_URL;
if (!url) {
  console.error("Set MIGRATE_DATABASE_URL to the database to migrate.");
  process.exit(1);
}

const host = new URL(url).host;
const confirmed = process.argv
  .find((a) => a.startsWith("--confirm-host="))
  ?.split("=")[1];
if (confirmed !== host) {
  console.error(`Refusing to run. Target host is ${host}; re-run with --confirm-host=${host}`);
  process.exit(1);
}

const statements = readFileSync("migrations/0006_groups.sql", "utf8")
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter((s) => s.replace(/--.*$/gm, "").trim().length > 0);

const sql = neon(url);

sql
  .transaction(statements.map((s) => sql.query(s)))
  .then(() => {
    console.log(`Applied ${statements.length} statements to ${host}.`);
  })
  .catch((err) => {
    console.error("Migration failed; nothing was applied.", err);
    process.exit(1);
  });
