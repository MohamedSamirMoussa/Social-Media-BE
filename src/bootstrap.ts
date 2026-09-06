
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

const bootstrap = async (app: Express) => {
  const frontendOrigin = process.env.FE_URI as string;

  if (!frontendOrigin) {
    throw new Error("FE_URI is required");
  }

  const port = Number(process.env.PORT)


  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(helmet());
  app.use(cors({
    origin: frontendOrigin,
    credentials: true
  }));
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

  await DBconnection()

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

  const server = app.listen(port, () => {
    console.log("====================");
    console.log(`Server is running on port: ${port}`);
    console.log("====================");
  });
  ioInit(server);

};

export default bootstrap;
