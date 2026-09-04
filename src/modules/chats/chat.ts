import { Socket } from "socket.io";
import { ChatEvents } from "./events/chat.events";

export const chatInt = (socket:Socket) => {
    const chatEvents = new ChatEvents(socket)

    chatEvents.sendPrivateMessageEvent()
    chatEvents.getConversationMessagesEvent()
}