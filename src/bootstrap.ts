import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import cors, { type CorsOptions } from "cors";
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
  const frontendOrigin = process.env.FE_URI?.trim().replace(/\/$/, "");

  if (!frontendOrigin) {
    throw new Error("FE_URI is required");
  }

  const allowedOrigins = [frontendOrigin, "http://localhost:5173"];

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(cookieParser());

  app.use(
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 4000,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        errMessage: "Too many requests, please try later",
      },
    }),
  );

  const databaseReady = Promise.resolve().then(() => DBconnection());

  void databaseReady.catch((error) => {
    console.error("Database initialization failed:", error);
  });

  app.use((_req, _res, next) => {
    void databaseReady.then(
      () => next(),
      (error) => next(error),
    );
  });

  app.use("/api/v1/auth", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
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
