import { Router } from "express";

import {
  authentication,
  validation,
} from "../../../middlewares";

import { StorageEnum } from "../../../utils";

import { cloudFileUpload } from "../../../utils/multer/multer.cloud";

import chatApiServices from "./chat.api.services";

import * as validators from "./chat.validation";

export const router = Router();

router.post(
  "/attachments",
  authentication(),
  cloudFileUpload({
    storageApproach: StorageEnum.disk,
  }).array("attachments", 10),
  validation(validators.uploadAttachments),
  chatApiServices.uploadAttachments,
);