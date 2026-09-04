import jwt, { JwtPayload, Secret, SignOptions, verify } from "jsonwebtoken";
import { RoleEnum, TokenEnum } from "../types/common.types";
import {
  HUserDocument,
  TokenModel,
  TokenRepository,
  UserModel,
  UserRepository,
} from "../../DB";
import { randomUUID } from "crypto";
import {
  BadRequestError,
  NotAuthorizedError,
} from "../handlingErrors/handlingErrors";

export enum SignatureEnumLevels {
  admin = "admin",
  Bearer = "Bearer",
}

export const generateToken = ({
  payload,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
  options = {
    expiresIn: Number(process.env.ACCESS_TOKEN_TIME_OUT),
  },
}: {
  payload: JwtPayload;
  secret: Secret;
  options?: SignOptions;
}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async ({
  token,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
}: {
  token: string;
  secret?: Secret;
}): Promise<JwtPayload> => {
  return verify(token, secret) as JwtPayload;
};

export const detectSignature = (role: RoleEnum = RoleEnum.user) => {
  let signatureLevel: SignatureEnumLevels = SignatureEnumLevels.Bearer;

  switch (role) {
    case RoleEnum.admin:
      signatureLevel = SignatureEnumLevels.admin;
      break;
    default:
      signatureLevel = SignatureEnumLevels.Bearer;
      break;
  }

  return signatureLevel;
};

export const getSignature = (
  signatureLevel: SignatureEnumLevels = SignatureEnumLevels.Bearer,
) => {
  let signature: {
    access_signature: string;
    refresh_signature: string;
  } = {
    access_signature: "",
    refresh_signature: "",
  };

  switch (signatureLevel) {
    case SignatureEnumLevels.admin:
      signature.access_signature = process.env
        .ACCESS_ADMIN_TOKEN_SIGNATURE as string;
      signature.refresh_signature = process.env
        .REFRESH_ADMIN_TOKEN_SIGNATURE as string;
      break;

    default:
      signature.access_signature = process.env
        .ACCESS_USER_TOKEN_SIGNATURE as string;
      signature.refresh_signature = process.env
        .REFRESH_USER_TOKEN_SIGNATURE as string;
      break;
  }

  return signature;
};

export const createLoginCredentials = async (user: HUserDocument) => {
  const signatureLevel = await detectSignature(user.role);

  const signature = await getSignature(signatureLevel);
  const jwtid = randomUUID();

  const access_token = await generateToken({
    payload: { id: user._id, role: user.role },
    secret: signature.access_signature,
    options: { expiresIn: Number(process.env.ACCESS_TOKEN_TIME_OUT), jwtid },
  });
  const refresh_token = await generateToken({
    payload: { id: user._id, role: user.role },
    secret: signature.refresh_signature,
    options: { expiresIn: Number(process.env.REFRESH_TOKEN_TIME_OUT), jwtid },
  });

  return { access_token, refresh_token };
};

export const decodeToken = async ({
  authorization,
  tokenType = TokenEnum.access,
}: {
  authorization: string;
  tokenType?: TokenEnum;
}) => {
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);
  const [bearerKey, token] = authorization.split(" ");

  if (!bearerKey || !token) throw new NotAuthorizedError("Missing token parts");

  const signatures = await getSignature(bearerKey as SignatureEnumLevels);

  const decode = await verifyToken({
    token,
    secret:
      tokenType === TokenEnum.refresh
        ? signatures.refresh_signature
        : signatures.access_signature,
  });
  if (!decode.id || !decode.iat) throw new BadRequestError("Invalid payload");
  const oldToken = await tokenModel.findOne({
    filter: { jti: decode.jti as string },
  });

  if (oldToken) throw new BadRequestError("Invalid or Old token");
  const user = await userModel.findOne({ filter: { _id: decode.id } });
  if (!user) throw new BadRequestError("Not register account");

  if (user.changedCredentialsAt?.getTime() || 0 > decode.iat * 1000)
    throw new NotAuthorizedError("invalid or old credentials");
  return { user, decode };
};

export const createRevokeToken = async (decode: JwtPayload) => {
  const tokenModel = new TokenRepository(TokenModel);
  if (!decode.jti) {
    throw new BadRequestError("Token jti is missing");
  }

  if (!decode.id) {
    throw new BadRequestError("Token user id is missing");
  }
  const result = await tokenModel.create({
    data: {
      jti: decode?.jti,
      expiresIn:
        (decode.iat as number) + Number(process.env.REFRESH_TOKEN_TIME_OUT),
      userId: decode.id,
    },
  });

  if (!result) throw new BadRequestError("Fail to revoke this token");

  return result;
};
