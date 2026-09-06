import z from "zod";
import * as validators from './comment.validation'
export type CommentBodyType = z.infer<typeof validators.commentBody.body>
export type CommentParamsType = z.infer<typeof validators.commentParam.params>
export type RefParamsType = z.infer<typeof validators.refParam.params>
export type ContentType = z.infer<typeof validators.commentContentBody.body>
export type OnModelType = z.infer<typeof validators.commentOnModelQuery.query>