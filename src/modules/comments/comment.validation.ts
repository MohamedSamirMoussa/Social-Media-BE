import z from "zod";
import { generalFields } from "../../middlewares";

export const commentContentBody = {
    body: z.strictObject({
        content: generalFields.content,
    })
}

export const commentOnModelQuery = {
    query: z.strictObject({
        onModel: generalFields.onModel,
    })
}

export const commentBody = {
    body: z.strictObject({
        content: generalFields.content,
        onModel: generalFields.onModel,
    })
}

export const commentParam = {
    params: z.strictObject({
        commentId: generalFields.objectId
    })
}

export const refParam = {
    params: z.strictObject({
        refId: generalFields.objectId
    })
}