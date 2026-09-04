import { NextFunction, Request, Response } from "express";
import {
  BadRequestError,
  ConflictError,
  decodeToken,
  NotAuthorizedError,
  RoleEnum,
  SignatureEnumLevels,
  TokenEnum,
  verifyToken,
} from "../utils";

export const authentication = (tokenType: TokenEnum = TokenEnum.access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let header = req.headers.authorization;

    if (!header) {
      const tokenName =
        tokenType === TokenEnum.refresh ? "refresh_token" : "access_token";
      const cookies = req.cookies[tokenName];

      if (cookies) {
        const sigLevel =
          req.cookies.signature_level || SignatureEnumLevels.Bearer;
        header = `${sigLevel} ${cookies}`;
      }
    }

    if (!header)
      throw new BadRequestError("Session is expired please login again");

    const { user, decode } = await decodeToken({
      authorization: header,
      tokenType,
    });

    req.user = user;
    req.decode = decode;
    next();
  };
};

export const authorization = (roles: RoleEnum[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new NotAuthorizedError("Please login first");
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


export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.access_token;

  if (!token) throw new NotAuthorizedError("Please login first");

  return authentication(TokenEnum.access)(req, res, next);
};

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
  return async (req: Request, res: Response, next: NextFunction) => {
    const resetToken = req.cookies.reset_password_token;
    if (!resetToken) throw new ConflictError("Token missing parts");

    const decode = await decodeResetToken(resetToken);

    req.decode = decode;

    next();
  };
};
