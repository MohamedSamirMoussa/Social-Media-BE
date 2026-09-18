import { config } from "dotenv";
import bootstrap from "./src/bootstrap";
import { resolve } from "node:path";
import express from "express";
import { existsSync } from "node:fs";

const envPath = resolve("./config/.env.development");

const result = config({ path: envPath });

console.log("ENV CHECK:", {
  fileExists: existsSync(envPath),
  fileReadError: result.error?.message ?? null,
  DB_URL_EXISTS: Boolean(process.env.DB_URL),
  FE_URI_EXISTS: Boolean(process.env.FE_URI),
});

const app = express();
const server = bootstrap(app);

export default server;
