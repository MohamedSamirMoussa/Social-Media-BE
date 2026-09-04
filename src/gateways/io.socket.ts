import type { Server as HttpServer } from "node:http";
import { Server, type Socket, type ExtendedError } from "socket.io";
import * as cookie from "cookie";

import {
  decodeToken,
  SignatureEnumLevels,
  TokenEnum,
} from "../utils";

import { chatInt } from "../modules/chats/chat";

export const connectedSockets = new Map<string, string[]>();

let io: Server | null = null;

export const emitOnlineUsers = () => {
  if (!io) return;

  io.emit(
    "online-users",
    Array.from(connectedSockets.keys()),
  );
};

export const socketAuthentication = async (
  socket: Socket,
  next: (error?: ExtendedError) => void,
) => {
  try {
    const parsedCookies = cookie.parse(
      socket.handshake.headers.cookie ?? "",
    );

    const accessToken = parsedCookies.access_token;
    const signatureLevel =
      parsedCookies.signature_level ??
      SignatureEnumLevels.Bearer;

    if (!accessToken) {
      return next(new Error("Access token not found"));
    }

    const { user } = await decodeToken({
      authorization: `${signatureLevel} ${accessToken}`,
      tokenType: TokenEnum.access,
    });

    socket.data.user = {
      id: String(user._id),
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);

    next(new Error("Unauthorized socket connection"));
  }
};

export const disconnection = (socket: Socket) => {
  socket.on("disconnect", () => {
    const userId = String(socket.data.user.id);
    const userTabs = connectedSockets.get(userId);

    if (userTabs) {
      const remainingTabs = userTabs.filter(
        (socketId) => socketId !== socket.id,
      );

      if (remainingTabs.length === 0) {
        connectedSockets.delete(userId);
      } else {
        connectedSockets.set(userId, remainingTabs);
      }
    }

    emitOnlineUsers();
  });
};

export const ioInit = (server: HttpServer) => {
  const frontendOrigin = process.env.FE_URI
    ?.trim()
    .replace(/\/+$/, "");

  if (!frontendOrigin) {
    throw new Error("FE_URI is required");
  }

  const allowedOrigins = [
    frontendOrigin,
    "http://localhost:5173",
  ];

  io = new Server(server, {
    path: "/socket.io",

    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },

    // مهم على Vercel
    transports: ["websocket"],
  });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    const userId = String(socket.data.user.id);
    const userTabs = connectedSockets.get(userId);

    if (userTabs) {
      userTabs.push(socket.id);
    } else {
      connectedSockets.set(userId, [socket.id]);
    }

    console.log("Socket connected:", userId, socket.id);

    disconnection(socket);
    emitOnlineUsers();

    socket.on("get-online-users", () => {
      socket.emit(
        "online-users",
        Array.from(connectedSockets.keys()),
      );
    });

    chatInt(socket);
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.IO server is not initialized");
  }

  return io;
};