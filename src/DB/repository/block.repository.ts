import { Model } from "mongoose";
import { IBlock } from "../model";
import { DBrepository } from "./db.repository";

export class BlockRepository extends DBrepository<IBlock> {
    constructor(protected override readonly model: Model<IBlock>) {
        super(model)
    }


}