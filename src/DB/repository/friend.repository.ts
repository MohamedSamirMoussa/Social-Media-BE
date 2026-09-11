import { Model } from "mongoose";
import { DBrepository } from "./db.repository";
import { IFriendSchema } from "../../utils";
import { QueryFilter } from "mongoose";
import { MongooseBaseQueryOptions } from "mongoose";

export class FriendRepository extends DBrepository<IFriendSchema> {
  constructor(protected override readonly model: Model<IFriendSchema>) {
    super(model);
  }

  deleteMany({
    options,
    filter
  }: {
    filter: QueryFilter<IFriendSchema>
    options?: MongooseBaseQueryOptions<IFriendSchema>
  }) {
    return this.model.deleteMany(filter, options)
  }
}
