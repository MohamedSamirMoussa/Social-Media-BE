import { model, Schema } from "mongoose";
import { AIroleEnum } from "../../utils";
import type { IBot } from "../../utils";

const schema = new Schema<IBot>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    messages: [
      {
        role: {
          type: String,
          enum: [AIroleEnum.user, AIroleEnum.assistant],
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 16000,
        },
      },
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

export const BotModel = model<IBot>("Bot", schema);
