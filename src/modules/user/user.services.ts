import { NextFunction, Request, Response } from "express";
import { HUserDocument, UserModel, UserRepository } from "../../DB";
import {
  ConfirmEmailType,
  ResendOtpType,
  ResetPasswordType,
  SigninType,
  SigninWithGoogleType,
  SignupType,
} from "./user.dto";
import {
  BadRequestError,
  clearLoginCookies,
  clearResetPasswordCookie,
  compareHash,
  ConflictError,
  createLoginCredentials,
  createRevokeToken,
  decryption,
  detectSignature,
  generateOtp,
  IUserSchema,
  loginWithGoogle,
  NotAuthorizedError,
  NotFoundError,
  ProviderEnum,
  RoleEnum,
  setLoginCookies,
  SubjectEnum,
  successHandler,
} from "../../utils";
import { Types } from "mongoose";

class UserServices {
  private userModel = new UserRepository(UserModel);

  private async handleLogin(res: Response, user: HUserDocument) {
    const { access_token, refresh_token } = await createLoginCredentials(user);

    const signatureLevel = detectSignature(user.role);

    setLoginCookies({
      res,
      accessToken: access_token,
      refreshToken: refresh_token,
      signatureLevel,
    });
  }

  constructor() {}

  signup = async (req: Request, res: Response) => {
    const { firstName, lastName, password, email }: SignupType = req.body;
    const user = await this.userModel.findOne({
      filter: { email },
      options: { lean: true },
    });
    if (user) throw new BadRequestError("User is already exists");
    const otp = generateOtp({ subject: SubjectEnum.registration, email });
    await this.userModel.create({
      data: {
        firstName,
        lastName,
        password,
        email,
        role: RoleEnum.user,
        confirmEmailOTP: otp,
        expiredOtpAt: new Date(Date.now() + 1 * 60 * 1000),
      },
    });

    return successHandler({
      res,
      message: "Signup successfully",
    });
  };

  confirmEmail = async (req: Request, res: Response) => {
    const { email, otp }: ConfirmEmailType = req.body;

    if (!email) throw new BadRequestError("Email is required");

    const user = await this.userModel.findOne({
      filter: { email },
      options: {
        lean: false,
      },
      select: "email otp confirmedAt expiredOtpAt confirmEmailOTP",
    });
    if (!user) throw new BadRequestError("Email isn't exists");
    if (user.confirmedAt) throw new ConflictError("Email is confirmed already");
    const otpExpired = user.expiredOtpAt && user.expiredOtpAt < new Date();
    if (otpExpired) {
      user.confirmEmailOTP = undefined;
      user.expiredOtpAt = undefined;
      await user.save();
      throw new BadRequestError("OTP has expired, please request a new one");
    }

    if (decryption(user.confirmEmailOTP as string) !== otp) {
      throw new BadRequestError("Invalid OTP");
    }
    user.confirmEmailOTP = undefined;
    user.expiredOtpAt = undefined;
    user.confirmedAt = new Date();
    await user.save();
    return successHandler({ res, status: 200, message: "Email confirmed" });
  };

  signin = async (req: Request, res: Response) => {
    const { email, password }: SigninType = req.body;

    const user = await this.userModel.findOne({
      filter: { email },
      options: {
        lean: false,
      },
    });
    if (!user) throw new BadRequestError("This account doesn't exists");
    if (!user.confirmedAt)
      throw new ConflictError("Verify your account please check your email");
    if (user.password && !(await compareHash(password, user.password)))
      throw new BadRequestError("Invalid credentials");
    await this.handleLogin(res, user);
    return successHandler({
      res,
      status: 201,
      message: `User login successfully... Hello, dear ${user.firstName + " " + user.lastName}`,
    });
  };

  signinWithGoogle = async (req: Request, res: Response) => {
    const { token }: SigninWithGoogleType = req.body;

    if (!token) {
      throw new NotAuthorizedError("Not authorized user");
    }

    const { given_name, family_name, email, email_verified } =
      await loginWithGoogle(token);

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const userData: Partial<IUserSchema> = {
      firstName: given_name || "",
      lastName: family_name || "",
      email,
      provider: ProviderEnum.google,
      role: RoleEnum.user,
    };

    if (email_verified) {
      userData.confirmedAt = new Date();
    }

    let user = await this.userModel.findOne({
      filter: { email },
    });

    if (!user) {
      user = (await this.userModel.create({
        data: userData,
      })) as HUserDocument;
    }

    await this.handleLogin(res, user);

    return successHandler({
      res,
      message: "Login successfully",
    });
  };

  forgetPassword = async (req: Request, res: Response) => {
    const { email }: ResendOtpType = req.body;

    if (!email) throw new BadRequestError("Email is required");

    const user = await this.userModel.findOne({
      filter: { email },
    });

    if (!user) throw new BadRequestError("User not found");

    if (!user.confirmedAt) throw new ConflictError("User isn't confirmed");

    const otp = generateOtp({
      user,
      subject: SubjectEnum.resetPassword,
      email,
    });

    user.forgetPasswordOtp = otp;
    user.forgetPasswordOtpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return successHandler({ res, message: "OTP Sent", status: 201 });
  };

  verifyOTP = async (req: Request, res: Response) => {
    const { email, otp }: ConfirmEmailType = req.body;

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const user = await this.userModel.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.confirmedAt) {
      throw new ConflictError("User isn't confirmed");
    }

    if (!user.forgetPasswordOtp) {
      throw new BadRequestError("OTP not found");
    }

    if (
      !user.forgetPasswordOtpExpiredAt ||
      user.forgetPasswordOtpExpiredAt < new Date()
    ) {
      user.forgetPasswordOtp = undefined;
      user.forgetPasswordOtpExpiredAt = undefined;

      await user.save();

      throw new BadRequestError("OTP is expired");
    }

    if (decryption(user.forgetPasswordOtp) !== otp) {
      throw new BadRequestError("Invalid OTP");
    }

    user.forgetPasswordOtp = undefined;
    user.forgetPasswordOtpExpiredAt = undefined;

    const resetToken = generateToken({
      payload: {
        userId: user._id.toString(),
        purpose: "reset-password",
      },
      secret: process.env.RESET_PASSWORD_TOKEN_SIGNATURE as string,
      options: {
        expiresIn: Number(process.env.RESET_PASSWORD_TOKEN),
      },
    });

    setResetPasswordCookie(res, resetToken);

    await user.save();

    return successHandler({
      res,
      message: "OTP verified successfully",
    });
  };
  resetPassword = async (req: Request, res: Response) => {
    const { newPassword }: ResetPasswordType = req.body;
    if (!newPassword)
      throw new BadRequestError("New password field is required");

    if (!req.decode?.userId)
      throw new NotAuthorizedError("Invalid reset password session");

    const user = await this.userModel.findOne({
      filter: {
        _id: new Types.ObjectId(req.decode.userId),
      },
    });

    if (!user) throw new BadRequestError("User not found");
    if (!user.confirmedAt) throw new ConflictError("Email not confirmed");

    user.password = newPassword;
    user.changedCredentialsAt = new Date();
    await user.save();
    clearResetPasswordCookie(res);
    return successHandler({
      res,
      message: "Password has been updated",
      status: 201,
    });
  };

  resendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const { email }: ResendOtpType = req.body;
      if (!email) throw new BadRequestError("Email is required");
      const user = await this.userModel.findOne({
        filter: { email },
        options: { lean: false },
      });
      if (!user) throw new NotFoundError("User not found");

      const otp = generateOtp({
        email: user.email,
        subject: user.confirmedAt
          ? SubjectEnum.resetPassword
          : SubjectEnum.registration,
      });

      if (!user.confirmedAt) {
        user.confirmEmailOTP = otp;
        user.expiredOtpAt = new Date(Date.now() + 1 * 60 * 1000);
      } else {
        user.forgetPasswordOtp = otp;
        user.forgetPasswordOtpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);
      }
      await user.save();
      return successHandler({ res, message: "OTP resent successfully" });
    } catch (error) {
      return next(error);
    }
  };

  getMe = async (req: Request, res: Response) => {
    if (!req.user) throw new NotAuthorizedError("User isn't logged");
    return successHandler({
      res,
      data: req.user,
    });
  };

  logout = async (req: Request, res: Response) => {
    if (!req.decode) {
      throw new NotAuthorizedError("Invalid session");
    }

    await createRevokeToken(req.decode);

    clearLoginCookies(res);

    return successHandler({
      res,
      message: "Logged out successfully",
    });
  };
}

export default new UserServices();
