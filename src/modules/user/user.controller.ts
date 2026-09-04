import { Router } from "express";
import {
  authentication,
  isResetPassword,
  validation,
} from "../../middlewares";
import userServices from "./user.services";
import * as validators from "./user.validation";
export const router = Router();

router.post(
  "/signup",
  validation(validators.signup),
  userServices.signup,
);
router.post(
  "/signin",
  validation(validators.signin),
  userServices.signin,
);
router.post(
  "/signin-google",
  // alreadyLogged(),
  // validation(validators.signin),
  userServices.signinWithGoogle,
);
router.post(
  "/confirm-email",
  validation(validators.confirmEmail),
  userServices.confirmEmail,
);
router.post(
  "/resend-otp",
  validation(validators.resendOtp),
  userServices.resendOtp,
);
router.post(
  "/forget-password",
  validation(validators.resendOtp),
  userServices.forgetPassword,
);
router.post(
  "/verify-otp",
  validation(validators.confirmEmail),
  userServices.verifyOTP,
);
router.patch(
  "/reset-password",
  isResetPassword(),
  validation(validators.resetPassword),
  userServices.resetPassword,
);
router.get("/me", authentication(), userServices.getMe);
router.post("/logout", authentication(), userServices.logout);
