import z from "zod";
import { generalFields } from "../../middlewares";

export const createPostBody = {
    body: z.strictObject({
        description: z.string().optional(),
        allowComments: z.boolean().optional(),
        tags: z.array(generalFields.objectId).optional(),
    }),
};

export const editPostBody = {
    body: z.strictObject({
        description: z.string().min(1),
    }),
};

export const postParam = {
    params: z.strictObject({
        postId: generalFields.objectId,
    }),
};

export const postAttachments = {
    files: z
        .array(
            z.object({
                fieldname: z.string(),
                originalname: z.string(),
                encoding: z.string(),
                mimetype: z.string(),
                size: z.number().positive(),
                path: z.string(),
            }),
        )
        .max(10, "Maximum 10 attachments allowed")
        .optional(),
};