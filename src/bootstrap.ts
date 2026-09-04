import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import {
  authRouter,
  chatRouter,
  commentRouter,
  PostRouter,
  profileRouter,
  reactRouter,
} from "./modules";
import { DBconnection } from "./DB";
import { ioInit } from "./gateways";
import { globalErrorHandling } from "./utils";

const bootstrap = (app: Express) => {
  const frontendOrigin = process.env.FE_URI?.trim();

  if (!frontendOrigin) {
    throw new Error("FE_URI is required");
  }

  app.set("trust proxy", 1);

  app.use(
    express.json(),
    helmet(),
    cors({
      origin: frontendOrigin,
      credentials: true,
    }),
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 4000,
      message: {
        error: "Too many requests, please try later",
      },
    }),
    cookieParser(),
  );

  // One initialization promise shared by requests in this server instance.
  const databaseReady = Promise.resolve().then(() => DBconnection());

  // Handle a rejection even if no request has reached the server yet.
  // databaseReady remains rejected so request handlers also receive the error.
  void databaseReady.catch((error) => {
    console.error("Database initialization failed:", error);
  });

  app.use((_req, _res, next) => {
    void databaseReady.then(
      () => next(),
      (error) => next(error),
    );
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use("/api/v1/posts", PostRouter);
  app.use("/api/v1/chats", chatRouter);
  app.use("/api/v1/react", reactRouter);
  app.use("/api/v1/comment", commentRouter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ message: "Done" });
  });

  app.use(globalErrorHandling);

  const server = createServer(app);
  const socketServer = ioInit(server);

  // Engine.IO handles socket requests outside the Express middleware chain.
  socketServer.engine.use(
    (
      _req: IncomingMessage,
      _res: ServerResponse,
      next: (error?: Error) => void,
    ) => {
      void databaseReady.then(
        () => next(),
        () => next(new Error("Database initialization failed")),
      );
    },
  );

  return server;
};

export default bootstrap;
