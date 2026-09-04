import { HydratedDocument, model, Schema, Types } from "mongoose";
import { ConversationTypeEnum, IConversation } from "../../utils";



const schema = new Schema<IConversation>({
  type: {
    type: String,
    default: ConversationTypeEnum.direct,
    enum: ConversationTypeEnum,
  },
  name: String,
  members: [
    {
      type: Types.ObjectId,
      ref: "User",
    },
  ],
});


export const ConversationModel = model("Conversations", schema) 
export type HConversationDoc = HydratedDocument<IConversation>