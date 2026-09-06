import z from "zod";
import * as validators from "./posts.validation";

export type CreatePostBodyType = z.infer<
  typeof validators.createPostBody.body
>;

export type EditPostBodyType = z.infer<
  typeof validators.editPostBody.body
>;

export type PostParamsType = z.infer<
  typeof validators.postParam.params
>;

export type PostAttachmentsType = z.infer<
  NonNullable<typeof validators.postAttachments.files>
>;