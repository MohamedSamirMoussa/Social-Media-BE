import { Model, MongooseBaseQueryOptions, QueryFilter } from "mongoose";
import { IComment } from "../../utils";
import { DBrepository } from "./db.repository";

export class CommentRepository extends DBrepository<IComment> {
  constructor(protected override readonly model: Model<IComment>) {
    super(model);
  }

  countDocuments({
    filter,
    options,
  }: {
    filter: QueryFilter<IComment>;
    options?: MongooseBaseQueryOptions<IComment>;
  }) {
    return this.model.countDocuments(filter, options);
  }
}
