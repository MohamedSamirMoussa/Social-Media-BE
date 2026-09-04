import { Router } from "express";
import { authentication } from "../../middlewares";
import reactServices from "./react.service";
export const router = Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true,
});

router.post("/:postId/like", authentication(), reactServices.toggleReact);
