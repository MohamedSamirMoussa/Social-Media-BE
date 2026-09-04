import { Router } from "express";
import { authentication } from "../../middlewares";
import postServices from "./posts.service";
import { cloudFileUpload } from "../../utils/multer/multer.cloud";
import { StorageEnum } from "../../utils";

export const router = Router();

router.post(
  "/",
  authentication(),
  cloudFileUpload({ storageApproach: StorageEnum.disk }).array(
    "attachments",
    10,
  ),
  postServices.createPost,
);

router.get("/", authentication(), postServices.getAllPosts);

router.delete("/:postId", authentication(), postServices.deletePost);
router.patch("/:postId", authentication(), postServices.editPost);