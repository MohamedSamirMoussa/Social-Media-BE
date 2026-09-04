import { Model } from "mongoose";
import { IConversation } from "../../utils";
import { DBrepository } from "./db.repository";

export class ConversationRepository extends DBrepository<IConversation> {
    constructor(protected override readonly model:Model<IConversation> ) {
        super(model)
    }
}