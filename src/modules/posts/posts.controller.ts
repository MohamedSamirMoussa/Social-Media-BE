import { Router } from "express";
import { authentication, validation } from "../../middlewares";
import postServices from "./posts.service";
import { cloudFileUpload } from "../../utils/multer/multer.cloud";
import { StorageEnum } from "../../utils";
import * as validators from './posts.validation'

export const router = Router();

router.post(
  "/",
  authentication(),
  cloudFileUpload({ storageApproach: StorageEnum.disk }).array(
    "attachments",
    10,
  ),
  validation({ ...validators.createPostBody, ...validators.postAttachments }),
  postServices.createPost,
);

router.get("/", authentication(), postServices.getAllPosts);

router.delete("/:postId", authentication(), validation(validators.postParam), postServices.deletePost);
router.patch("/:postId", authentication(), validation({
  ...validators.editPostBody,
  ...validators.postParam
}), postServices.editPost);