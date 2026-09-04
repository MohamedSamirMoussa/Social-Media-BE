import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {
  authRouter,
  chatRouter,
  commentRouter,
  PostRouter,
  profileRouter,
  reactRouter,
} from "./modules";
import { DBconnection } from "./DB";
import cookieParser from "cookie-parser";
import { ioInit } from "./gateways";
import { globalErrorHandling } from "./utils";
const bootstrap = async (app: Express) => {
  const frontendOrigin = process.env.FE_URI?.trim();

  if (!frontendOrigin) {
    throw new Error("FR_URI is required");
  }
  await DBconnection();
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
  app.set("trust proxy", 1);
  const port = Number(process.env.PORT);

  // routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use("/api/v1/posts", PostRouter);
  app.use("/api/v1/chats", chatRouter);
  app.use("/api/v1/react", reactRouter);
  app.use("/api/v1/comment", commentRouter);

  app.get("/health", (req, res) => {
    res.status(200).json({
      message: "Done",
    });
  });

  app.use(globalErrorHandling);
  const server = app.listen(port, () => {
    console.log("====================================");
    console.log(`Server is running on port ::: ${port}`);
    console.log("====================================");
  });

  ioInit(server);
};

export default bootstrap;
