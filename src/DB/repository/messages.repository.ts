import { Model } from "mongoose";
import { IMassage } from "../../utils";
import { DBrepository } from "./db.repository";


export class MessageRepository extends DBrepository<IMassage> {
    constructor(protected override readonly model:Model<IMassage>) {
        super(model)
    }
}