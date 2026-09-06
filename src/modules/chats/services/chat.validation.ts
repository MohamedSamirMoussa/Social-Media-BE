import z from "zod";

export const uploadAttachmentFile = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number().positive(),
  path: z.string(),
});

export const uploadAttachmentsSchema = z
  .array(uploadAttachmentFile)
  .min(1, "At least one attachment is required")
  .max(10, "Maximum 10 attachments allowed");

export const uploadAttachments = {
  files: uploadAttachmentsSchema,
};