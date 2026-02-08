import { config } from "dotenv";
import { execSync } from "child_process";

// Load environment variables
config({ path: ".env.local" });

// Run drizzle-kit push
execSync("npx drizzle-kit push", { stdio: "inherit" });
