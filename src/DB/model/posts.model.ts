import { model, Schema, Types } from "mongoose";
import { IPost } from "../../utils";


const schema = new Schema<IPost>({
    description: {
        type: String,
    },
    attachments: [{
        secure_url: String,
        public_id: String
    }],
    ownerId:{
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    tags:[{
        type: Types.ObjectId,
        ref: "User"
    }]
})


export const PostModel = model("Post", schema);