import { Request, Response } from "express";
import { BadRequestError, CommentEnum, successHandler } from "../../utils";
import {
  CommentModel,
  CommentRepository,
  PostModel,
  PostRepository,
} from "../../DB";
import { Types } from "mongoose";

class CommentServices {
  private postModel = new PostRepository(PostModel);
  private commentModel = new CommentRepository(CommentModel);
  constructor() {}

  create = async (req: Request, res: Response) => {
    const { refId } = req.params;
    const { content, onModel = CommentEnum.post } = req.body;
    if (!req.user) throw new BadRequestError("User not authorized");
    if (!refId) throw new BadRequestError("Reference id is required");
    if (!content) throw new BadRequestError("Comment content is required");

    if (!Object.values(CommentEnum).includes(onModel))
      throw new BadRequestError("Invalid comment target");

    if (onModel === CommentEnum.post) {
      const post = await this.postModel.findById({
        id: refId as unknown as Types.ObjectId,
      });

      if (!post)
        throw new BadRequestError("Comments are disabled for this post");

      if (post.allowComments === false)
        throw new BadRequestError("Comments are disabled for this post");
    } else if (onModel === CommentEnum.comment) {
      const parentComment = await this.commentModel.findOne({
        filter: {
          _id: refId,
        },
      });

      if (!parentComment) {
        throw new BadRequestError("Parent comment not found");
      }
    }

    const comment = await this.commentModel.create({
      data: {
        content,
        ownerId: req.user?._id,
        refId: refId as unknown as Types.ObjectId,
        onModel,
      },
    });

    if (!comment) throw new BadRequestError("Comment creation failed");

    const populatedComment = await this.commentModel.findOne({
      filter: {
        _id: comment._id,
      },
      options: {
        populate: [
          {
            path: "ownerId",
            select: "firstName lastName userName profileImage",
          },
        ],
      },
    });

    const commentCounts =
      onModel === CommentEnum.post
        ? await this.commentModel.countDocuments({
            filter: {
              refId,
              onModel: CommentEnum.post,
            },
          })
        : undefined;

    return successHandler({
      res,
      message: "Comment created successfully",
      data: {
        comment: populatedComment,
        refId,
        onModel,
        commentCounts,
      },
    });
  };

  get = async (req: Request, res: Response) => {
    const { refId } = req.params;
    const { onModel } = req.query;

    if (!refId) {
      throw new BadRequestError("Reference id is required");
    }

    if (!onModel) throw new BadRequestError("Model is required");

    const comments = await this.commentModel.find({
      filter: {
        refId,
        onModel: onModel as CommentEnum.post,
      },
      options: {
        lean: true,
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
      data: comments,
    });
  };
}

export default new CommentServices();
