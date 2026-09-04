// src/utils/authCookies.ts
import type { CookieOptions, Response } from "express";
import { SignatureEnumLevels } from "../security/token";


const isProduction =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

const getTimeInMilliseconds = (
  value: string | undefined,
  fallbackSeconds: number,
) => {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return fallbackSeconds * 1000;
  }

  return seconds * 1000;
};

export const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const setLoginCookies = ({
  res,
  accessToken,
  refreshToken,
  signatureLevel,
}: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  signatureLevel: SignatureEnumLevels;
}) => {
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: getTimeInMilliseconds(process.env.ACCESS_TOKEN_TIME_OUT, 15 * 60),
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: getTimeInMilliseconds(
      process.env.REFRESH_TOKEN_TIME_OUT,
      7 * 24 * 60 * 60,
    ),
  });

  res.cookie("signature_level", signatureLevel, {
    ...baseCookieOptions,
    maxAge: getTimeInMilliseconds(
      process.env.REFRESH_TOKEN_TIME_OUT,
      7 * 24 * 60 * 60,
    ),
  });
};

export const clearLoginCookies = (res: Response) => {
  res.clearCookie("access_token", baseCookieOptions);
  res.clearCookie("refresh_token", baseCookieOptions);
  res.clearCookie("signature_level", baseCookieOptions);
};

export const setResetPasswordCookie = (res: Response, resetToken: string) => {
  res.cookie("reset_password_token", resetToken, {
    ...baseCookieOptions,
    maxAge: getTimeInMilliseconds(process.env.RESET_PASSWORD_TOKEN, 10 * 60),
  });
};

export const clearResetPasswordCookie = (res: Response) => {
  res.clearCookie("reset_password_token", baseCookieOptions);
};
