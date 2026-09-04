import { Model, MongooseBaseQueryOptions, QueryFilter } from "mongoose";
import { IPostLike } from "../../utils";
import { DBrepository } from "./db.repository";

export class ReactRepository extends DBrepository<IPostLike> {
  constructor(protected override readonly model: Model<IPostLike>) {
    super(model);
  }

  countDocuments({
    filter,
    options,
  }: {
    filter: QueryFilter<IPostLike>;
    options?: MongooseBaseQueryOptions<IPostLike>;
  }) {
    return this.model.countDocuments(filter, options);
  }
}
