import { Model } from "mongoose";
import { IBot } from "../../utils";
import { DBrepository } from "./db.repository";

export class BotRepository extends DBrepository<IBot> {
  constructor(protected override readonly model: Model<IBot>) {
    super(model);
  }
}
