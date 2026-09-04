import { model, Schema, Types } from "mongoose";
import { StatusEnum } from "../../utils";
import { IFriendSchema } from "../../utils";

const schema = new Schema<IFriendSchema>({
  requestFromId: {
    type: Types.ObjectId,
    ref: "User",
  },
  requestToId: {
    type: Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: Object.values(StatusEnum),
    default: StatusEnum.pending,
  },
});

export const FriendsModel = model('Friend', schema) 
