import { NextFunction, Request, Response } from "express";
import {
  decodeToken,
  NotAuthorizedError,
  RoleEnum,
  SignatureEnumLevels,
  TokenEnum,
  verifyToken,
  ConflictError,
} from "../utils";

export const authentication = (
  tokenType: TokenEnum = TokenEnum.access,
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      let authorization = req.headers.authorization;

      if (!authorization) {
        const tokenName =
          tokenType === TokenEnum.refresh
            ? "refresh_token"
            : "access_token";

        const cookieToken = req.cookies?.[tokenName] as
          | string
          | undefined;

        if (cookieToken) {
          const signatureLevel =
            (req.cookies?.signature_level as SignatureEnumLevels) ||
            SignatureEnumLevels.Bearer;

          authorization = `${signatureLevel} ${cookieToken}`;
        }
      }

      if (!authorization) {
        throw new NotAuthorizedError(
          "Session is expired please login again",
        );
      }

      const { user, decode } = await decodeToken({
        authorization,
        tokenType,
      });

      req.user = user;
      req.decode = decode;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const authorization = (roles: RoleEnum[] = []) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return next(new NotAuthorizedError("Please login first"));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(
        new NotAuthorizedError(
          "Access denied: You don't have the required role",
        ),
      );
    }

    next();
  };
};

export const isAuthenticated = authentication(TokenEnum.access);

export const decodeResetToken = async (token: string) => {
  const decode = await verifyToken({
    token,
    secret: process.env.RESET_PASSWORD_TOKEN_SIGNATURE as string,
  });

  if (!decode.userId || decode.purpose !== "reset-password") {
    throw new NotAuthorizedError("Invalid reset password token");
  }

  return decode;
};

export const isResetPassword = () => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const resetToken = req.cookies?.reset_password_token;

      if (!resetToken) {
        throw new ConflictError("Token missing parts");
      }

      req.decode = await decodeResetToken(resetToken);

      next();
    } catch (error) {
      next(error);
    }
  };
};