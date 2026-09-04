import { Request, Response } from "express";
import {
  FriendRepository,
  FriendsModel,
  PostModel,
  PostRepository,
  ReactModel,
  ReactRepository,
  UserModel,
  UserRepository,
} from "../../DB";
import {
  BadRequestError,
  ConflictError,
  IPost,
  NotAuthorizedError,
  StatusEnum,
  successHandler,
  uploadFiles,
} from "../../utils";
import { Types } from "mongoose";

class PostService {
  private postModel = new PostRepository(PostModel);
  private userModel = new UserRepository(UserModel);
  private friendModel = new FriendRepository(FriendsModel);
  private reactModel = new ReactRepository(ReactModel);
  constructor() {}

  createPost = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new NotAuthorizedError("User not authorized to create post");
    }

    const userId = req.user._id;

    const { description, allowComments, tags } = req.body;

    const files = req.files as Express.Multer.File[] | undefined;

    if (!description && (!files || !files.length)) {
      throw new BadRequestError("Description or attachments are required");
    }

    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      const user = await this.userModel.find({
        filter: { _id: { $in: tags } },
      });
      if (user.length !== tags.length)
        throw new BadRequestError("One or more tags are invalid");

      const friends = await this.friendModel.find({
        filter: {
          status: StatusEnum.accepted,
          $or: [
            {
              requestFromId: userId,
              requestToId: { $in: tags },
            },
          ],
        },
      });

      if (friends.length !== tags.length)
        throw new BadRequestError("One or more tags are not your friends");

      uniqueTags = Array.from(new Set(tags));
    }

    const attachments = files?.length
      ? await uploadFiles({
          files: files.map((file: Express.Multer.File) => file.path),
          path: `posts/${userId}`,
        })
      : [];

    const post = await this.postModel.create({
      data: {
        ownerId: userId,
        description,
        allowComments: allowComments ?? true,
        attachments,
        tags: uniqueTags,
      },
    });

    const populatedPost = await this.postModel.findOne({
      filter: { _id: post._id as unknown as Types.ObjectId },
      options: {
        populate: [
          {
            path: "ownerId",
            select: "firstName lastName username profileImage",
          },
        ],
      },
    });

    return successHandler({
      res,
      data: {
        post: populatedPost,
      },
      message: "Post created successfully",
    });
  };

  getAllPosts = async (req: Request, res: Response) => {
    if (!req.user) throw new ConflictError("Login first");
    const posts = await this.postModel.find({
      filter: {},
      options: {
        lean: true,
        populate: [
          {
            path: "ownerId",
            select: "firstName lastName userName profileImage coverImages",
          },
        ],
      },
    });

    if (!posts) throw new BadRequestError("No posts found");

    const postsWithLikes = await Promise.all(
      posts.map(async (post: Partial<IPost>) => {
        const likeCounts = await this.reactModel.countDocuments({
          filter: {
            postId: post?._id as unknown as Types.ObjectId,
          },
        });
        const userLike = await this.reactModel.findOne({
          filter: {
            postId: post?._id as unknown as Types.ObjectId,
            userId: req.user?._id as unknown as Types.ObjectId,
          },
        });

        return {
          ...post,
          likeCounts,
          isLiked: Boolean(userLike),
        };
      }),
    );

    return successHandler({
      res,
      data: postsWithLikes,
    });
  };

  deletePost = async (req: Request, res: Response) => {
    if (!req.user) throw new ConflictError("Login first");

    const { postId } = req.params;

    if (!postId) throw new BadRequestError("Post id not found");

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        ownerId: req.user?._id,
      },
    });

    if (!post)
      throw new BadRequestError(
        "Post not found or you are not allowed to delete it",
      );

    await this.postModel.deleteOne({
      filter: {
        _id: postId,
      },
    });

    return successHandler({
      res,
      message: "Post deleted successfully",
    });
  };

  editPost = async (req: Request, res: Response) => {
    if (!req.user) throw new ConflictError("Login first");
    const { postId } = req.params;
    const { description } = req.body;
    if (!postId) {
      throw new BadRequestError("Params missing");
    }
    const post = await this.postModel.findOne({
      filter: { _id: postId },
    });
    if (!post) {
      throw new BadRequestError("Post not found");
    }

    await this.postModel.updateOne({
      filter: {
        _id: postId,
      },
      update: {
        $set: {
          description,
        },
      },
    });

    const updatedPost = await this.postModel.findOne({
      filter: {
        _id: postId,
      },

      options: {
        populate: [
          {
            path: "ownerId",
            select: "firstName lastName profileImage username",
          },
        ],
      },
    });

    return successHandler({
      res,
      data: { post: updatedPost },
      message: "Post updated successfully",
    });
  };
}

export default new PostService();
