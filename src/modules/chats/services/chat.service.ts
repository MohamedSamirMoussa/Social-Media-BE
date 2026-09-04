import { Socket } from "socket.io";
import {
  ConversationModel,
  ConversationRepository,
  HConversationDoc,
  MessageModel,
  MessageRepository,
} from "../../../DB";
import { ConversationTypeEnum, IMassage } from "../../../utils";
import { connectedSockets, getIo } from "../../../gateways";

export class ChatServices {
  private conversationModel = new ConversationRepository(ConversationModel);
  private messageModel = new MessageRepository(MessageModel);
  async joinPrivateChat(socket: Socket, targetUserId: string) {
    let conversation = await this.conversationModel.findOne({
      filter: {
        type: ConversationTypeEnum.direct,
        members: {
          $all: [socket.data.user.id, targetUserId],
        },
      },
    });

    if (!conversation) {
      conversation = (await this.conversationModel.create({
        data: {
          type: ConversationTypeEnum.direct,
          members: [socket.data.user.id, targetUserId],
        },
      })) as HConversationDoc;
    }
    const roomId = conversation._id.toString();
    socket.join(roomId);

    const targetSockets = connectedSockets.get(targetUserId);

    targetSockets?.forEach((socketId) => {
      getIo()?.sockets.sockets.get(socketId)?.join(roomId);
    });
    return conversation;
  }

  async sendPrivateMessage(
    socket: Socket,
    data: Partial<IMassage> & { targetUserId: string },
  ) {
    const { text, targetUserId, attachments } = data;
    // if(!text || !targetUserId) {
    //     throw new BadRequestError("All fields are required")
    // }

    const senderId = socket.data.user.id;

    const conversation = await this.joinPrivateChat(socket, targetUserId);

    const message = await this.messageModel.create({
      data: {
        text: text || "",
        attachments: attachments || [],
        conversationId: conversation._id,
        senderId,
      },
    });

    getIo()?.to(conversation._id.toString()).emit("message-sent", message);
  }

  async getConversationMessages(socket: Socket, targetUserId: string) {
    const conversation = await this.joinPrivateChat(socket, targetUserId);

    const messages = await this.messageModel.find({
      filter: { conversationId: conversation._id },
    });

    socket.emit("chat-history", messages);
  }
}

/*
    Mohamed
    Menna

    Room for mohamed (id) and menna (id) === conversationId 
*/
