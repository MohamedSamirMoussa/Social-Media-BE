import { Request, Response } from "express";
import {
  FriendRepository,
  FriendsModel,
  UserModel,
  UserRepository,
} from "../../DB";
import {
  BadRequestError,
  ConflictError,
  IFriendSchema,
  NotAuthorizedError,
  NotFoundError,
  StatusEnum,
  successHandler,
  uploadFile,
  uploadFiles,
} from "../../utils";
import { QueryFilter, Types } from "mongoose";
import { StatusType } from "./profile.dto";

class ProfileServices {
  private friendModel = new FriendRepository(FriendsModel);
  private userModel = new UserRepository(UserModel);

  constructor() {}

  uploadProfileImage = async (req: Request, res: Response) => {
    if (!req.user)
      throw new ConflictError("Not authorized user ... Please login first");
    if (!req.file) {
      throw new BadRequestError("Please upload an image");
    }

    const { secure_url, public_id } = await uploadFile({
      file: req.file.path,
      path: `/${req.user?._id}_${req.user?.firstName}_${req.user?.lastName}/profile-image`,
    });

    await this.userModel.findOneAndUpdate({
      filter: req.user?._id,
      update: {
        profileImage: {
          secure_url,
          public_id,
        },
      },
    });

    return successHandler({
      res,
      message: "Photo uploaded successfully",
      data: {
        profileImage: {
          secure_url,
          public_id,
        },
      },
    });
  };

  uploadCoverImages = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ConflictError("Not authorized user ... Please login first");
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new BadRequestError("Please upload at least one image");
    }

    const files = (req.files as Express.Multer.File[]).map((file) => file.path);

    const coverImages = await uploadFiles({
      files,
      path: `${req.user?._id}_${req.user?.firstName}/cover`,
    });

    await this.userModel.findOneAndUpdate({
      filter: req.user?._id,
      update: {
        coverImages,
      },
    });

    return successHandler({
      res,
      message: "Cover images uploaded successfully",
      data: {
        coverImages,
      },
    });
  };

  // Add
  sendAddRequest = async (req: Request, res: Response) => {
    if (!req.user) return;
    const requestFromId = req.user._id;
    const { requestToId } = req.body;
    if (requestFromId.equals(requestToId))
      throw new ConflictError("You can't send add request to your self ");

    const user = await this.userModel.findById({
      id: requestToId,
    });
    if (!user) throw new NotFoundError("User not found");

    const existingRelation = await this.friendModel.findOne({
      filter: {
        $or: [
          {
            requestFromId,
            requestToId,
          },
          {
            requestFromId: requestToId,
            requestToId: requestFromId,
          },
        ],
      },
    });

    if (existingRelation) {
      if (existingRelation.status === StatusEnum.accepted) {
        throw new ConflictError("You are already friends");
      }
      if (existingRelation.status === StatusEnum.pending) {
        throw new ConflictError("Friend request already exists");
      }
    }

    await this.friendModel.create({
      data: {
        requestFromId,
        requestToId,
        status: StatusEnum.pending,
      },
    });

    return successHandler({
      res,
      message: `Your friend request sent to ${user.firstName} ${user.lastName}`,
      status: 202,
    });
  };

  listRequests = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new NotAuthorizedError("Please login first");
    }
    const userId = req.user?._id;
    const { status }: StatusType = req.query as unknown as StatusType;

    const filter: Partial<QueryFilter<IFriendSchema>> = { status };

    if (filter.status === StatusEnum.accepted) {
      filter.$or = [{ requestToId: userId }, { requestFromId: userId }];
    } else {
      filter.requestToId = userId;
    }

    const requests = await this.friendModel.find({
      filter,
      populate: [
        {
          path: "requestFromId",
          select: "firstName lastName username profileImage coverImages",
        },
        {
          path: "requestToId",
          select: "firstName lastName username profileImage coverImages",
        },
      ],
    });
    const friends =
      status === StatusEnum.accepted
        ? requests.map((request) => {
            const from = request.requestFromId as any;
            const to = request.requestToId as any;

            return from._id.toString() === userId.toString() ? to : from;
          })
        : requests;
    return successHandler({
      res,
      data: {
        friends,
        requests,
      },
    });
  };

  getAllUser = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new NotAuthorizedError("Please login first");
    }

    type FriendshipStatus =
      | "none"
      | "pending_sent"
      | "pending_received"
      | "accepted";

    const userId = req.user._id;

    const users = await this.userModel.find({
      filter: {
        _id: {
          $ne: userId,
        },
      },
      options: {
        lean: true,
        select: "firstName lastName username profileImage coverImages",
      },
    });

    const relations = await this.friendModel.find({
      filter: {
        $or: [
          {
            requestFromId: userId,
          },
          {
            requestToId: userId,
          },
        ],
      },
    });

    const userWithStatus = users.map((user) => {
      const relation = relations.find((relation) => {
        return (
          relation.requestFromId.toString() === user._id.toString() ||
          relation.requestToId.toString() === user._id.toString()
        );
      });

      let friendshipStatus: FriendshipStatus = "none";

      if (relation) {
        if (relation.status === StatusEnum.accepted) {
          friendshipStatus = "accepted";
        }
        if (relation.status === StatusEnum.pending) {
          friendshipStatus =
            relation.requestFromId.toString() === userId.toString()
              ? "pending_sent"
              : "pending_received";
        }
      }

      return {
        ...user,
        friendshipStatus,
      };
    });

    return successHandler({ res, data: userWithStatus });
  };

  updateRequest = async (req: Request, res: Response) => {
    if (!req.user) return;
    const requestToId = req.user?.id;
    const { friendRequestId, response } = req.body;

    const friendRequest = await this.friendModel.findOne({
      filter: {
        _id: friendRequestId as unknown as Types.ObjectId,
        requestToId,
        status: StatusEnum.pending,
      },
    });
    if (!friendRequest)
      throw new BadRequestError("There wasn't a friend requests");
    friendRequest.status = response;
    await friendRequest.save();

    return successHandler({
      res,
      message:
        response === StatusEnum.accepted
          ? "Friend request accepted"
          : "Friend request rejected",

      data: {
        request: friendRequest,
      },
    });
  };
}

export default new ProfileServices();
