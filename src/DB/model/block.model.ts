import { model, Schema } from "mongoose";
import { Types } from "mongoose";

export interface IBlock {
    blockerId: Types.ObjectId
    blockedId: Types.ObjectId
    createdAt?: Date;
    updatedAt?: Date;
}

const schema = new Schema<IBlock>({
    blockerId: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    blockedId: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

schema.index(
    {
        blockerId: 1,
        blockedId: 1
    },
    {
        unique: true
    }
)

export const BlockModel = model("Block", schema)