import {
  Model,
  MongooseUpdateQueryOptions,
  QueryFilter,
  UpdateQuery,
} from "mongoose";
import { IPost } from "../../utils";
import { DBrepository } from "./db.repository";

export class PostRepository extends DBrepository<IPost> {
  constructor(protected override readonly model: Model<IPost>) {
    super(model);
  }

  updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<IPost>;
    update: UpdateQuery<IPost>;
    options?: MongooseUpdateQueryOptions<IPost>;
  }) {
    return this.model.updateOne(filter, update, options);
  }
}
