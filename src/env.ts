import { config } from "dotenv";
import { resolve } from "node:path";

// Load local configuration before importing modules that read process.env.
// Vercel supplies deployment environment variables directly.
if (!process.env.VERCEL) {
  config({ path: resolve("./config/.env.development") });
}
