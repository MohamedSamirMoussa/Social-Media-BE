import z from "zod";
import * as validators from "./chat.validation";

export type UploadAttachmentType = z.infer<
  typeof validators.uploadAttachmentFile
>;

export type UploadAttachmentsType = z.infer<
  typeof validators.uploadAttachmentsSchema
>;