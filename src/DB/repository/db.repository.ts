import type {
  CreateOptions,
  Model,
  MongooseBaseQueryOptions,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  SortOrder,
  Types,
  UpdateQuery,
} from "mongoose";

export abstract class DBrepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create({
    data,
    options,
  }: {
    data: Partial<TDocument>;
    options?: CreateOptions;
  }) {
    const doc = new this.model(data);

    return doc.save(options);
  }

  async find({
    filter,
    select,
    options,
    sort,
    populate,
  }: {
    filter: QueryFilter<TDocument>;
    select?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
    sort?: Record<string, SortOrder>;
    populate?: PopulateOptions[] | PopulateOptions;
  }) {
    const query = this.model.find(filter, select, options);
    if (sort) {
      query.sort(sort);
    } else if (populate) {
      query.populate(populate);
    }

    return await query.exec();
  }

  async findOne({
    filter,
    options,
    select,
  }: {
    filter: Partial<QueryFilter<TDocument>>;
    options?: QueryOptions<TDocument>;
    select?: ProjectionType<TDocument>;
  }) {
    return await this.model.findOne(filter, select, options);
  }

  async findById({
    id,
    select,
    options,
    populate,
  }: {
    id: Types.ObjectId;
    select?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
    populate?: PopulateOptions[] | PopulateOptions;
  }) {
    const doc = this.model.findById(id, select, options);

    if (populate) doc.populate(populate);

    return await doc.exec();
  }

  async deleteOne({
    filter,
    options,
  }: {
    filter: Partial<QueryFilter<TDocument>>;
    options?: MongooseBaseQueryOptions<TDocument>;
  }) {
    return this.model.deleteOne(filter, options);
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    update?: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }) {
    return await this.model.findOneAndUpdate(filter, update, options);
  }
}
