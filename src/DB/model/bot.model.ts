import { model, Schema } from "mongoose";
import { AIroleEnum, type IAIMessage, type IBot } from "../../utils";

const messageSchema = new Schema<IAIMessage>(
  {
    role: {
      type: String,
      enum: Object.values(AIroleEnum),
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 16000,
    },
  },
  {
    _id: false,
  },
);

const botSchema = new Schema<IBot>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

export const BotModel = model<IBot>("Bot", botSchema);
