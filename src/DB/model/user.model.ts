import { model, Schema } from "mongoose";
import {
  encryption,
  hashed,
  IUserSchema,
  ProviderEnum,
  RoleEnum,
} from "../../utils";
import { HydratedDocument } from "mongoose";
import { PostModel } from "./posts.model";
import { FriendsModel } from "./friends.model";
import { ReactModel } from "./react.model";

const schema = new Schema<IUserSchema>(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    email: {
      type: String,
      required: function (): any {
        return this.provider === ProviderEnum.system;
      },
      unique: true,
    },
    password: {
      type: String,

      required: function (): any {
        return this.provider === ProviderEnum.system;
      },
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },
    provider: {
      type: String,
      required: true,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    profileImage: {
      secure_url: String,
      public_id: String,
    },
    coverImages: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    changedCredentialsAt: Date,
    confirmEmailOTP: String,
    expiredOtpAt: Date,
    confirmedAt: Date,
    forgetPasswordOtp: String,
    forgetPasswordOtpExpiredAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    strict: false,
  },
);

// Hashing
schema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await hashed(this.password);
  }

  if (this.isModified("confirmEmailOTP")) {
    this.confirmEmailOTP = encryption(this.confirmEmailOTP as string);
  }

  if (this.isModified("forgetPasswordOtp")) {
    this.forgetPasswordOtp = encryption(this.forgetPasswordOtp as string);
  }
});

schema.pre("save", function () {
  if (this.isNew) {
    this.set("username", `${this.firstName} ${this.lastName}`);
  }
});

schema.pre("deleteOne", async function () {
  const filter = this.getFilter()

  const userId = filter._id
  if (!userId) return

  await Promise.all([
    PostModel.deleteMany({
      ownerId: userId,
    }),

    ReactModel.deleteMany({
      userId,
    }),

    FriendsModel.deleteMany({
      $or: [
        {
          requestFromId: userId,
        },
        {
          requestToId: userId,
        },
      ],
    }),
  ]);
})

export const UserModel = model("User", schema);

export type HUserDocument = HydratedDocument<IUserSchema>;
