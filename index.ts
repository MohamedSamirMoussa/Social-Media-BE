import { config } from "dotenv";
import bootstrap from "./src/bootstrap";
import { resolve } from "node:path";
import express from "express";

if (process.env.VERCEL !== "1") {
  config({ path: resolve("./config/.env.development") });
}
const app = express();
const server = bootstrap(app);

export default server;
