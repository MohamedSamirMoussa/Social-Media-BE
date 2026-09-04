import type { Response } from "express";
import { Types } from "mongoose";

export enum TokenEnum {
  access = "access",
  refresh = "refresh",
  resetPassword = "resetPassword",
}

export enum StorageEnum {
  memory = "memory",
  disk = "disk",
}

export interface IPostLike {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
}

export interface ITokenSchema {
  jti: string;
  expiresIn: number;
  userId: Types.ObjectId;
}

export interface ISuccessHandler {
  res: Response;
  data?: {};
  status?: number;
  message?: string;
}

export enum RoleEnum {
  admin = "admin",
  user = "user",
}

export enum ConversationTypeEnum {
  direct = "direct",
  group = "group",
}

export enum ProviderEnum {
  system = "system",
  google = "google",
}

export enum StatusEnum {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}

export enum CommentEnum {
  post = "post",
  comment = "comment",
}

export interface IAttachment {
  secure_url: string;
  public_id: string;
}

export interface IUserSchema {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RoleEnum;
  confirmedAt: Date;
  changedCredentialsAt?: Date | undefined;
  confirmEmailOTP?: string | undefined;
  expiredOtpAt?: Date | undefined;
  forgetPasswordOtp?: string | undefined;
  forgetPasswordOtpExpiredAt?: Date | undefined;
  provider: ProviderEnum;
  profileImage?: {
    secure_url: string;
    public_id: string;
  };
  coverImages?: [
    {
      secure_url: String;
      public_id: String;
    },
  ];
}

export interface IFriendSchema {
  requestFromId: Types.ObjectId;
  requestToId: Types.ObjectId;
  status: StatusEnum;
}

export interface IConversation {
  type: string;
  name?: string;
  members: Types.ObjectId[];
}

export interface IMassage {
  text: string;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  attachments: string[];
}

export interface IAttachment {
  secure_url: string;
  public_id: string;
}

export interface IPost {
  _id: Types.ObjectId;

  description?: string;

  attachments?: IAttachment[];

  ownerId: Types.ObjectId;

  allowComments: boolean;

  tags: Types.ObjectId[];
}
export interface IComment {
  content: string;
  // attachments: string[];
  ownerId: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: CommentEnum;
}
