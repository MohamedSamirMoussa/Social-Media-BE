import { Model } from "mongoose";
import { IUserSchema } from "../../utils";
import { DBrepository } from "./db.repository";
import { QueryFilter } from "mongoose";
import { UpdateQuery } from "mongoose";
import { MongooseUpdateQueryOptions } from "mongoose";

export class UserRepository extends DBrepository<IUserSchema> {
  constructor(protected override readonly model: Model<IUserSchema>) {
    super(model);
  }

  updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<IUserSchema>;
    update: UpdateQuery<IUserSchema>;
    options?: MongooseUpdateQueryOptions<IUserSchema>;
  }) {
    return this.model.updateOne(filter, update, options);
  }

}
