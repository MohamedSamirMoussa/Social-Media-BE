import { Router } from "express";
import { authentication } from "../../middlewares";
import profileServices from "./profile.services";
// import * as validators from "./profile.validation";
import { cloudFileUpload } from "../../utils/multer/multer.cloud";
import { StorageEnum } from "../../utils";
export const router = Router();

router.post(
  "/send-add-request",
  authentication(),
  profileServices.sendAddRequest,
);
router.put(
  "/profile-image",
  authentication(),
  cloudFileUpload({ storageApproach: StorageEnum.disk }).single("image"),
  profileServices.uploadProfileImage,
);
router.put(
  "/cover-images",
  authentication(),
  cloudFileUpload({ storageApproach: StorageEnum.disk }).array("images", 10),
  profileServices.uploadCoverImages,
);
router.patch(
  "/update-request",
  authentication(),
  profileServices.updateRequest,
);

router.get(
  "/all-requests",
  authentication(),
  // validation(validators.listRequests),
  profileServices.listRequests,
);

router.get(
  "/all-users",
  authentication(),
  // validation(validators.listRequests),
  profileServices.getAllUser,
);
