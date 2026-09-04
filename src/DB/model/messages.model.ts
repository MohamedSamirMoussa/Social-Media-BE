import { HydratedDocument, model, Schema, Types } from "mongoose";
import { IAttachment, IMassage } from "../../utils";

const attachmentSchema = new Schema<IAttachment>({
  secure_url: {
    required: true,
    type: String,
  },
  public_id: {
    required: true,
    type: String,
  },
});

const schema = new Schema<IMassage>({
  text: String,
  conversationId: {
    type: Types.ObjectId,
    ref: "Conversations",
    required: true,
  },
  senderId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  attachments: [attachmentSchema],
});

export const MessageModel = model("Messages", schema);
export type HMessageDoc = HydratedDocument<IMassage>;
