import z from "zod";
import * as validators from './user.validation'


export type SignupType = z.infer<typeof validators.signup.body>
export type SigninType = z.infer<typeof validators.signin.body>
export type ConfirmEmailType = z.infer<typeof validators.confirmEmail.body>
export type ResendOtpType = z.infer<typeof validators.resendOtp.body>
export type SigninWithGoogleType = z.infer<typeof validators.signinWithGoogle.body>
export type ResetPasswordType = z.infer<typeof validators.resetPassword.body>
