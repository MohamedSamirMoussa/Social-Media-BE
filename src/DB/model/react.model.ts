import { model, Schema, Types } from "mongoose";
import { IPostLike } from "../../utils";

const schema = new Schema<IPostLike>(
  {
    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

schema.index(
  {
    postId: 1,
    userId: 1,
  },
  { unique: true },
);

export const ReactModel = model("React", schema);
