import { Server as HttpServer } from "http";
import { Socket, Server } from "socket.io";
import cookie from "cookie";
import { ConflictError, NotAuthorizedError, verifyToken } from "../utils";
import { chatInt } from "../modules/chats/chat";
//Key    // Value
export const connectedSockets = new Map<string, string[]>();
let io: Server | null = null;

export const emitOnlineUsers = () => {
  if (!io) return;

  const onlineUsers = Array.from(connectedSockets.keys());

  io.emit("online-users", onlineUsers);
};

export const socketAuthentication = async (socket: Socket, next: Function) => {
  try {
    const cookies = cookie.parseCookie(socket.handshake.headers.cookie || "");
    if (!cookies) return next(new NotAuthorizedError("Unauthorized"));
    const accessToken = cookies.access_token;
    if (!accessToken) return next(new ConflictError("Access token not found"));

    const payload = await verifyToken({ token: accessToken });

    socket.data.user = {
      id: payload.id,
      role: payload.role,
    };

    const userTabs = connectedSockets.get(socket.data.user.id);
    if (!userTabs) connectedSockets.set(socket.data.user.id, [socket.id]);
    else userTabs.push(socket.id);
    next();
  } catch (error) {
    throw next(new NotAuthorizedError("Unauthorized"));
  }
};

export const disconnection = (socket: Socket) => {
  socket.on("disconnect", () => {
    const userId = socket.data.user.id.toString();

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
    throw new Error("FR_URI is required");
  }

  io = new Server(server, {
    cors: {
      origin: frontendOrigin,
      credentials: true,
    },
  });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id.toString();

    console.log("connected:", userId, socket.id);

    emitOnlineUsers();

    socket.on("get-online-users", () => {
      socket.emit("online-users", Array.from(connectedSockets.keys()));
    });

    chatInt(socket);

    disconnection(socket);
  });

  return io;
};

export const getIo = () => {
  try {
    if (!io) {
      throw new Error("Server doesn't initialized");
    }

    return io;
  } catch (error) {
    console.log(error);
    throw new Error("Server io error:::", { cause: error });
  }
};
