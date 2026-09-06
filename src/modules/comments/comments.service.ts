import {
  Request,
  Response,
} from "express";

import {
  BadRequestError,
  CommentEnum,
  successHandler,
} from "../../utils";

import {
  CommentModel,
  CommentRepository,
  PostModel,
  PostRepository,
} from "../../DB";

import { Types } from "mongoose";

import {
  CommentBodyType,
  CommentParamsType,
  ContentType,
  RefParamsType,
} from "./comment.dto";

class CommentServices {
  private postModel =
    new PostRepository(PostModel);

  private commentModel =
    new CommentRepository(CommentModel);

  constructor() { }

  create = async (
    req: Request<RefParamsType>,
    res: Response,
  ) => {
    const { refId } = req.params;

    const {
      content,
      onModel = CommentEnum.post,
    }: CommentBodyType = req.body;

    if (!req.user) {
      throw new BadRequestError(
        "User not authorized",
      );
    }

    if (onModel === CommentEnum.post) {
      const post =
        await this.postModel.findById({
          id: refId as unknown as Types.ObjectId,
        });

      if (!post) {
        throw new BadRequestError(
          "Post not found",
        );
      }

      if (
        post.allowComments === false
      ) {
        throw new BadRequestError(
          "Comments are disabled for this post",
        );
      }
    }

    if (
      onModel === CommentEnum.comment
    ) {
      const parentComment =
        await this.commentModel.findOne(
          {
            filter: {
              _id: refId,
            },
          },
        );

      if (!parentComment) {
        throw new BadRequestError(
          "Parent comment not found",
        );
      }
    }

    const comment =
      await this.commentModel.create({
        data: {
          content,
          ownerId: req.user._id,
          refId:
            refId as unknown as Types.ObjectId,
          onModel,
        },
      });

    if (!comment) {
      throw new BadRequestError(
        "Comment creation failed",
      );
    }

    const populatedComment =
      await this.commentModel.findOne(
        {
          filter: {
            _id: comment._id,
          },
          options: {
            populate: [
              {
                path: "ownerId",
                select:
                  "firstName lastName username profileImage",
              },
            ],
          },
        },
      );

    const commentCounts =
      onModel === CommentEnum.post
        ? await this.commentModel.countDocuments(
          {
            filter: {
              refId,
              onModel:
                CommentEnum.post,
            },
          },
        )
        : undefined;

    return successHandler({
      res,
      message:
        "Comment created successfully",
      data: {
        comment: populatedComment,
        refId,
        onModel,
        commentCounts,
      },
    });
  };

  get = async (
    req: Request<RefParamsType>,
    res: Response,
  ) => {
    const { refId } = req.params;

    const { onModel } =
      req.query as {
        onModel: CommentEnum;
      };

    const comments =
      await this.commentModel.find({
        filter: {
          refId,
          onModel,
        },
        options: {
          lean: true,
          populate: [
            {
              path: "ownerId",
              select:
                "firstName lastName username profileImage",
            },
          ],
        },
      });

    return successHandler({
      res,
      data: comments,
    });
  };

  update = async (
    req: Request<CommentParamsType>,
    res: Response,
  ) => {
    const { commentId } =
      req.params;

    const {
      content,
    }: ContentType = req.body;

    if (!req.user) {
      throw new BadRequestError(
        "User not authorized",
      );
    }

    const comment =
      await this.commentModel.findById(
        {
          id: commentId as unknown as Types.ObjectId,
        },
      );

    if (!comment) {
      throw new BadRequestError(
        "Comment not found",
      );
    }

    if (
      comment.ownerId.toString() !==
      req.user._id.toString()
    ) {
      throw new BadRequestError(
        "You can't edit this comment",
      );
    }

    comment.content =
      content.trim();

    await comment.save();

    const populatedComment =
      await this.commentModel.findOne(
        {
          filter: {
            _id: comment._id,
          },
          options: {
            populate: [
              {
                path: "ownerId",
                select:
                  "firstName lastName username profileImage",
              },
            ],
          },
        },
      );

    return successHandler({
      res,
      data: {
        comment:
          populatedComment,
      },
      message:
        "Comment updated successfully",
    });
  };

  delete = async (
    req: Request<CommentParamsType>,
    res: Response,
  ) => {
    const { commentId } =
      req.params;

    if (!req.user) {
      throw new BadRequestError(
        "User not authorized",
      );
    }

    const comment =
      await this.commentModel.findById(
        {
          id: commentId as unknown as Types.ObjectId,
        },
      );

    if (!comment) {
      throw new BadRequestError(
        "Comment not found",
      );
    }

    if (
      comment.ownerId.toString() !==
      req.user._id.toString()
    ) {
      throw new BadRequestError(
        "You can't delete this comment",
      );
    }

    await this.commentModel.deleteOne(
      {
        filter: {
          _id: comment._id,
        },
      },
    );

    const commentCounts =
      comment.onModel ===
        CommentEnum.post
        ? await this.commentModel.countDocuments(
          {
            filter: {
              refId:
                comment.refId,
              onModel:
                CommentEnum.post,
            },
          },
        )
        : undefined;

    return successHandler({
      res,
      data: {
        commentId,
        refId:
          comment.refId,
        onModel:
          comment.onModel,
        commentCounts,
      },
      message:
        "Comment deleted successfully",
    });
  };
}

export default new CommentServices();