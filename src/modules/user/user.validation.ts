import z from "zod";
import { generalFields } from "../../middlewares";

const authFields = z.strictObject({
  email: generalFields.email,
  password: generalFields.password,
});

export const signin = {
  body: authFields,
};

export const signup = {
  body: authFields
    .extend({
      firstName: generalFields.firstName,
      lastName: generalFields.lastName,
      confirmPassword: generalFields.confirmPassword,
      role: generalFields.role,
    })
    .refine((val) => val.password == val.confirmPassword, {
      path: ["confirm-password"],
      message: `Confirm Password doesn't match password`,
    }),
};

export const confirmEmail = {
  body: z.strictObject({
    email: generalFields.email.optional(),
    otp: generalFields.otp,
  }),
};

export const resendOtp = {
  body: z.strictObject({
    email: generalFields.email,
  }),
};

export const resetPassword = {
  body: z.strictObject({
    newPassword: generalFields.password,
  }),
};

export const signinWithGoogle = {
  body: z.strictObject({
    token: generalFields.token,
  }),
};
