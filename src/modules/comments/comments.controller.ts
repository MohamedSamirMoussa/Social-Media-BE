import { Router } from "express";
import { authentication } from "../../middlewares";
import commentServices from "./comments.service";
export const router = Router({
  strict: true,
  mergeParams: true,
  caseSensitive: true,
});

router.post("/:refId/comment", authentication(), commentServices.create);
router.get("/:refId", authentication(), commentServices.get);
