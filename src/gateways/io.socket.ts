import type { Server as HttpServer } from "node:http";
import { Server, type Socket, type ExtendedError } from "socket.io";
import * as cookie from "cookie";
import { ConflictError, NotAuthorizedError, verifyToken } from "../utils";
import { chatInt } from "../modules/chats/chat";

export const connectedSockets = new Map<string, string[]>();
let io: Server | null = null;

export const emitOnlineUsers = () => {
  if (!io) return;
  io.emit("online-users", Array.from(connectedSockets.keys()));
};

export const socketAuthentication = async (
  socket: Socket,
  next: (error?: ExtendedError) => void,
) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const accessToken = cookies.access_token;

    if (!accessToken) {
      return next(new ConflictError("Access token not found"));
    }

    const payload = await verifyToken({ token: accessToken });

    socket.data.user = {
      id: String(payload.id),
      role: payload.role,
    };
  } catch {
    return next(new NotAuthorizedError("Unauthorized"));
  }

  next();
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
  const frontendOrigin = process.env.FE_URI?.trim();

  if (!frontendOrigin) {
    throw new Error("FE_URI is required");
  }

  io = new Server(server, {
    cors: {
      origin: frontendOrigin,
      credentials: true,
    },
  });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    const userId = String(socket.data.user.id);
    const userTabs = connectedSockets.get(userId);

    // Track sockets only after their connection has been accepted.
    if (userTabs) userTabs.push(socket.id);
    else connectedSockets.set(userId, [socket.id]);

    console.log("connected:", userId, socket.id);

    disconnection(socket);
    emitOnlineUsers();

    socket.on("get-online-users", () => {
      socket.emit("online-users", Array.from(connectedSockets.keys()));
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
