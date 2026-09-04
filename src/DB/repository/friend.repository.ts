import { Model } from "mongoose";
import { DBrepository } from "./db.repository";
import { IFriendSchema } from "../../utils";

export class FriendRepository extends DBrepository<IFriendSchema> {
  constructor(protected override readonly model: Model<IFriendSchema>) {
    super(model);
  }
}
