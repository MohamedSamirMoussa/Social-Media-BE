import { Router } from "express";
import { authentication } from "../../../middlewares";
import { StorageEnum } from "../../../utils";
import { cloudFileUpload } from "../../../utils/multer/multer.cloud";
import chatApiServices from "./chat.api.services";

export const router = Router();
router.post(
  "/attachments",
  authentication(),
  cloudFileUpload({ storageApproach: StorageEnum.disk }).array(
    "attachments",
    10,
  ),
  chatApiServices.uploadAttachments,
);
