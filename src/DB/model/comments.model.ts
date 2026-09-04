import { model, Schema, Types } from "mongoose";
import { CommentEnum, IComment } from "../../utils";

const schema = new Schema<IComment>(
  {
    content: String,
    // attachments: [String],
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    refId: {
      type: Types.ObjectId,
      refPath: "onModel",
      required: true,
    },
    onModel: {
      type: String,
      required: true,
      enum: Object.values(CommentEnum),
      default: CommentEnum.post,
    },
  },
  { timestamps: true },
);

schema.index({
  refId: 1,
  onModel: 1,
  createdAt: -1,
});

export const CommentModel = model("Comment", schema);
