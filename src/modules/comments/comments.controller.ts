import { Router } from "express";

import {
  authentication,
  validation,
} from "../../middlewares";

import commentServices from "./comments.service";

import * as validators from "./comment.validation";

export const router = Router({
  strict: true,
  mergeParams: true,
  caseSensitive: true,
});

router.post(
  "/:refId/comment",
  authentication(),
  validation({
    ...validators.refParam,
    ...validators.commentBody,
  }),
  commentServices.create,
);

router.get(
  "/:refId",
  authentication(),
  validation({
    ...validators.refParam,
    ...validators.commentOnModelQuery,
  }),
  commentServices.get,
);

router.patch(
  "/:commentId",
  authentication(),
  validation({
    ...validators.commentParam,
    ...validators.commentContentBody,
  }),
  commentServices.update,
);

router.delete(
  "/:commentId",
  authentication(),
  validation(validators.commentParam),
  commentServices.delete,
);  