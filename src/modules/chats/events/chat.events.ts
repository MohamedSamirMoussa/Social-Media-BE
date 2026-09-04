import { Socket } from "socket.io";
import { ChatServices } from "../services/chat.service";

export class ChatEvents {
    private chatService:ChatServices = new ChatServices()
    constructor(private socket:Socket) {}

    sendPrivateMessageEvent() {
        this.socket.on("sent-private-message" , (data)=>{
            this.chatService.sendPrivateMessage(this.socket, data)
        })
    }

    getConversationMessagesEvent() {
        this.socket.on("get-chat-history", (data)=>{
            this.chatService.getConversationMessages(this.socket, data)
        })
    }

}